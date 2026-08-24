import type { UnidyClient } from "../api";
import { Auth } from "./auth";
import { AuthHelpers } from "./auth-helpers";
import { authState, authStore } from "./store/auth-store";

const encodeSegment = (payload: object) => Buffer.from(JSON.stringify(payload)).toString("base64url");

const makeJwt = (expiresInSeconds: number, sid = "sid-1") =>
  `${encodeSegment({ alg: "none" })}.${encodeSegment({ sid, sub: "user-1", exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.sig`;

const tokenResponse = (jwt: string, refreshToken: string) => [null, { jwt, refresh_token: refreshToken }] as const;

const makeClient = (refreshTokenMock: jest.Mock) => ({ auth: { refreshToken: refreshTokenMock } }) as unknown as UnidyClient;

describe("AuthHelpers.refreshToken", () => {
  beforeEach(() => {
    authStore.reset();
    authStore.setGlobalError("auth", null);
    authStore.setSignInId("sid-1");
    authStore.setRefreshToken("rt-old");
  });

  it("shares a single in-flight request between concurrent callers", async () => {
    const refreshMock = jest
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(tokenResponse(makeJwt(3600), "rt-new")), 10)));
    const helpers = new AuthHelpers(makeClient(refreshMock));

    await Promise.all([helpers.refreshToken(), helpers.refreshToken(), helpers.refreshToken()]);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(authState.refreshToken).toBe("rt-new");
    expect(authState.authenticated).toBe(true);
  });

  it("issues a new request once the previous refresh has settled", async () => {
    const refreshMock = jest
      .fn()
      .mockResolvedValueOnce(tokenResponse(makeJwt(3600), "rt-new"))
      .mockResolvedValueOnce(tokenResponse(makeJwt(3600), "rt-newer"));
    const helpers = new AuthHelpers(makeClient(refreshMock));

    await helpers.refreshToken();
    await helpers.refreshToken();

    expect(refreshMock).toHaveBeenCalledTimes(2);
    expect(refreshMock).toHaveBeenNthCalledWith(2, { signInId: "sid-1", refreshToken: "rt-new" });
    expect(authState.refreshToken).toBe("rt-newer");
  });

  it("does not reset the store when a stale refresh fails after a concurrent refresh rotated the token", async () => {
    const adoptedJwt = makeJwt(3600);
    const refreshMock = jest.fn().mockImplementation(() => {
      // Simulate another SDK copy/tab completing its refresh while this request is in flight.
      localStorage.setItem("unidy_refresh_token", "rt-new");
      sessionStorage.setItem("unidy_token", adoptedJwt);
      return Promise.resolve(["invalid_refresh_token", { error_identifier: "invalid_refresh_token" }]);
    });
    const helpers = new AuthHelpers(makeClient(refreshMock));

    await helpers.refreshToken();

    expect(authState.refreshToken).toBe("rt-new");
    expect(authState.token).toBe(adoptedJwt);
    expect(authState.authenticated).toBe(true);
    expect(authState.sid).toBe("sid-1");
    expect(authState.globalErrors.auth).toBeFalsy();
    expect(localStorage.getItem("unidy_refresh_token")).toBe("rt-new");
  });

  it("resets the store when the rejected refresh token is still the current one", async () => {
    const refreshMock = jest.fn().mockResolvedValue(["invalid_refresh_token", { error_identifier: "invalid_refresh_token" }]);
    const helpers = new AuthHelpers(makeClient(refreshMock));

    await helpers.refreshToken();

    expect(authState.refreshToken).toBeNull();
    expect(authState.authenticated).toBe(false);
    expect(authState.globalErrors.auth).toBe("invalid_refresh_token");
    expect(localStorage.getItem("unidy_refresh_token")).toBeNull();
  });
});

describe("Auth.getToken", () => {
  it("issues exactly one refresh request for concurrent callers without a valid access token", async () => {
    authStore.reset();
    authStore.setGlobalError("auth", null);
    authStore.setSignInId("sid-1");
    authStore.setRefreshToken("rt-old");

    const freshJwt = makeJwt(3600);
    const refreshMock = jest
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(tokenResponse(freshJwt, "rt-new")), 10)));
    const auth = await Auth.initialize(makeClient(refreshMock));
    refreshMock.mockClear();

    // Expired access token, as after a browser restore where sessionStorage is gone.
    authStore.setToken(makeJwt(-60));

    const tokens = await Promise.all([auth.getToken(), auth.getToken(), auth.getToken()]);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(tokens).toEqual([freshJwt, freshJwt, freshJwt]);
    expect(authState.refreshToken).toBe("rt-new");
  });
});
