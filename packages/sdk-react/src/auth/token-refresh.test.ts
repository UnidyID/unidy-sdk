import { beforeEach, describe, expect, it, mock } from "bun:test";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

// authStorage guards on `typeof window` and touches the storages lazily, so shimming
// the globals before the first call is sufficient.
(globalThis as Record<string, unknown>).window = globalThis;
globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();

import type { StandaloneUnidyClient } from "@unidy.io/sdk/standalone";
import { authStorage } from "./auth-storage";
import { refreshSession } from "./token-refresh";

const encodeSegment = (payload: object) => Buffer.from(JSON.stringify(payload)).toString("base64url");

const makeJwt = (expiresInSeconds: number, sid = "sid-1") =>
  `${encodeSegment({ alg: "none" })}.${encodeSegment({ sid, sub: "user-1", exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.sig`;

const tokenResponse = (jwt: string, refreshToken: string) => [null, { jwt, refresh_token: refreshToken, sid: "sid-1" }] as const;

const makeClient = (refreshTokenMock: ReturnType<typeof mock>) =>
  ({ auth: { refreshToken: refreshTokenMock } }) as unknown as StandaloneUnidyClient;

const permanentRejection = () => Promise.resolve(["invalid_refresh_token", { error_identifier: "invalid_refresh_token" }]);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  authStorage.syncFromStorage();
  authStorage.setSignInId("sid-1");
  authStorage.setRefreshToken("rt-old");
});

describe("refreshSession", () => {
  it("shares a single in-flight request between concurrent callers", async () => {
    const freshJwt = makeJwt(3600);
    const refreshMock = mock(() => new Promise((resolve) => setTimeout(() => resolve(tokenResponse(freshJwt, "rt-new")), 10)));
    const client = makeClient(refreshMock);

    const tokens = await Promise.all([refreshSession(client), refreshSession(client), refreshSession(client)]);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(tokens).toEqual([freshJwt, freshJwt, freshJwt]);
    expect(authStorage.getRefreshToken()).toBe("rt-new");
  });

  it("keeps the session on a transient error instead of clearing storage", async () => {
    const refreshMock = mock(() => Promise.resolve(["connection_failed", null]));
    const onError = mock(() => {});

    const token = await refreshSession(makeClient(refreshMock), { onError });

    expect(token).toBeNull();
    expect(authStorage.getRefreshToken()).toBe("rt-old");
    expect(authStorage.getSignInId()).toBe("sid-1");
    expect(onError).toHaveBeenCalledWith("connection_failed");
  });

  it("notifies every caller that joined the shared flight when the refresh fails", async () => {
    const refreshMock = mock(
      () => new Promise((resolve) => setTimeout(() => resolve(["connection_failed", null]), 10)),
    );
    const client = makeClient(refreshMock);
    const initiatorOnError = mock(() => {});
    const joinerOnError = mock(() => {});

    await Promise.all([
      refreshSession(client, { onError: initiatorOnError }),
      refreshSession(client, { onError: joinerOnError }),
      refreshSession(client),
    ]);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(initiatorOnError).toHaveBeenCalledWith("connection_failed");
    expect(joinerOnError).toHaveBeenCalledWith("connection_failed");
  });

  it("clears storage when the rejected refresh token is still the persisted one", async () => {
    const refreshMock = mock(permanentRejection);
    const onError = mock(() => {});

    const token = await refreshSession(makeClient(refreshMock), { onError });

    expect(token).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(authStorage.getSignInId()).toBeNull();
    expect(localStorage.getItem("unidy_refresh_token")).toBeNull();
    expect(onError).toHaveBeenCalledWith("invalid_refresh_token");
  });

  it("adopts a same-page rotation instead of clearing when the stale refresh fails", async () => {
    const adoptedJwt = makeJwt(3600);
    const refreshMock = mock(() => {
      // Another SDK copy on the same page (e.g. the Stencil SDK) rotates the shared keys.
      // No `storage` event fires for same-page writes, so the cached snapshot goes stale.
      localStorage.setItem("unidy_refresh_token", "rt-new");
      sessionStorage.setItem("unidy_token", adoptedJwt);
      return permanentRejection();
    });

    const token = await refreshSession(makeClient(refreshMock));

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(token).toBe(adoptedJwt);
    expect(authStorage.getToken()).toBe(adoptedJwt);
    expect(authStorage.getRefreshToken()).toBe("rt-new");
  });

  it("retries with the adopted refresh token when the rotation came from another tab", async () => {
    const freshJwt = makeJwt(3600);
    const refreshMock = mock(() => Promise.resolve(tokenResponse(freshJwt, "rt-newer")));
    refreshMock.mockImplementationOnce(() => {
      // A cross-tab rotation updates localStorage but cannot write this tab's sessionStorage.
      localStorage.setItem("unidy_refresh_token", "rt-new");
      return permanentRejection();
    });
    const client = makeClient(refreshMock);

    const token = await refreshSession(client);

    expect(refreshMock).toHaveBeenCalledTimes(2);
    expect(refreshMock).toHaveBeenLastCalledWith({ signInId: "sid-1", refreshToken: "rt-new" });
    expect(token).toBe(freshJwt);
    expect(authStorage.getRefreshToken()).toBe("rt-newer");
  });

  it("stops retrying after the budget is exhausted but keeps the newest persisted token", async () => {
    let rotation = 0;
    const refreshMock = mock(() => {
      rotation += 1;
      localStorage.setItem("unidy_refresh_token", `rt-rotated-${rotation}`);
      return permanentRejection();
    });

    const token = await refreshSession(makeClient(refreshMock));

    // 1 initial attempt + MAX_STALE_REFRESH_RETRIES
    expect(refreshMock).toHaveBeenCalledTimes(4);
    expect(token).toBeNull();
    expect(authStorage.getRefreshToken()).toBe("rt-rotated-4");
    expect(localStorage.getItem("unidy_refresh_token")).toBe("rt-rotated-4");
  });

  it("discards the result when a logout lands while the refresh is in flight", async () => {
    const refreshMock = mock(() => {
      authStorage.clearAll();
      return Promise.resolve(tokenResponse(makeJwt(3600), "rt-new"));
    });

    const token = await refreshSession(makeClient(refreshMock));

    expect(token).toBeNull();
    expect(authStorage.getToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
  });

  it("returns null without clearing login-flow state when no session exists", async () => {
    authStorage.clearAll();
    authStorage.setEmail("user@example.com");
    const refreshMock = mock(() => Promise.resolve(tokenResponse(makeJwt(3600), "rt-new")));

    const token = await refreshSession(makeClient(refreshMock));

    expect(token).toBeNull();
    expect(refreshMock).toHaveBeenCalledTimes(0);
    expect(authStorage.getEmail()).toBe("user@example.com");
  });
});

describe("ReactUnidyClient", () => {
  it("shares the page-wide single-flight with refreshSession", async () => {
    const { ReactUnidyClient } = await import("../client");
    const client = new ReactUnidyClient({ baseUrl: "http://localhost:3000", apiKey: "test-api-key" });

    const freshJwt = makeJwt(3600);
    const refreshMock = mock(() => new Promise((resolve) => setTimeout(() => resolve(tokenResponse(freshJwt, "rt-new")), 10)));
    client.auth = makeClient(refreshMock).auth;

    const getIdToken = (token: string | null) =>
      (client as unknown as { getValidIdToken(token: string | null): Promise<string | null> }).getValidIdToken(token);

    // An API call's token lookup and the auto-refresh path racing on page load.
    const tokens = await Promise.all([getIdToken(makeJwt(-60)), getIdToken(null), refreshSession(client)]);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(tokens).toEqual([freshJwt, freshJwt, freshJwt]);
    expect(authStorage.getRefreshToken()).toBe("rt-new");
  });
});
