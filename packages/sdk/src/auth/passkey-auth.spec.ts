import type { UnidyClient } from "../api";
import { AuthHelpers } from "./auth-helpers";
import { PasskeyAuth } from "./passkey-auth";
import { authState, authStore } from "./store/auth-store";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const options = { challenge: "Y2hhbGxlbmdl", timeout: 60000, rpId: "localhost", userVerification: "required", allowCredentials: [] };
const credential = {
  id: "asserted-user-passkey",
  rawId: new Uint8Array([1]).buffer,
  type: "public-key",
  response: {
    authenticatorData: new Uint8Array([2]).buffer,
    clientDataJSON: new Uint8Array([3]).buffer,
    signature: new Uint8Array([4]).buffer,
  },
};
const jwt = (payload: object) => `e30.${btoa(JSON.stringify(payload))}.sig`;
const token = { jwt: jwt({ sid: "asserted-sid", email: "asserted@example.com", sub: "asserted-user" }), refresh_token: "refresh-asserted" };
// Trusted activation is simulated in unit tests; Playwright covers actual trusted pointer/keyboard events separately.
const gesture = { isTrusted: true } as Event;

describe("coordinated passkey sign-in (mocked WebAuthn)", () => {
  let get: jest.Mock;
  let capabilities: jest.Mock;
  let conditional: jest.Mock;
  let fetchOptions: jest.Mock;
  let verify: jest.Mock;
  let success: jest.Mock;
  let controller: PasskeyAuth;
  let client: UnidyClient;

  beforeEach(() => {
    authStore.reset();
    authStore.setStep("email");
    capabilities = jest.fn().mockResolvedValue({ immediateGet: true });
    conditional = jest.fn().mockResolvedValue(true);
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: { getClientCapabilities: capabilities, isConditionalMediationAvailable: conditional },
    });
    get = jest.fn().mockResolvedValue(credential);
    Object.defineProperty(navigator, "credentials", { configurable: true, value: { get } });
    Object.defineProperty(navigator, "userActivation", { configurable: true, value: { isActive: true } });
    fetchOptions = jest.fn().mockResolvedValue([null, options]);
    verify = jest.fn().mockResolvedValue([null, token]);
    client = { auth: { getPasskeyOptions: fetchOptions, authenticateWithPasskey: verify } } as unknown as UnidyClient;
    success = jest.fn();
    controller = new PasskeyAuth(client, success);
  });

  afterEach(async () => {
    await controller.cancel();
    jest.restoreAllMocks();
  });

  it.each(["missing", "empty", "false", "throws", "sync-throws"])(
    "never sends unknown uiMode when capabilities are %s",
    async (variant) => {
      if (variant === "missing") delete window.PublicKeyCredential.getClientCapabilities;
      if (variant === "empty") capabilities.mockResolvedValue({});
      if (variant === "sync-throws")
        capabilities.mockImplementation(() => {
          throw new Error("probe failed");
        });
      if (variant === "false") capabilities.mockResolvedValue({ immediateGet: false });
      if (variant === "throws") capabilities.mockRejectedValue(new Error("probe failed"));
      expect(await controller.prepareImmediate()).toBe(false);
      expect(fetchOptions).not.toHaveBeenCalled();
      const fallback = jest.fn();
      await controller.authenticate({ mode: "immediate", event: gesture, onFallback: fallback });
      await flush();
      expect(fallback).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith(expect.objectContaining({ mediation: "conditional" }));
      expect(get.mock.calls[0][0]).not.toHaveProperty("uiMode");
    },
  );

  it("uses a prefetched discoverable challenge synchronously in the gesture without a signal", async () => {
    authStore.setSignInId("typed-user-sid");
    fetchOptions.mockResolvedValue([null, { ...options, allowCredentials: [{ type: "public-key", id: "YWJj" }] }]);
    expect(await controller.prepareImmediate()).toBe(true);
    const result = controller.authenticate({ mode: "immediate", event: gesture });
    expect(get).toHaveBeenCalledTimes(1); // before awaiting anything after the gesture
    expect(fetchOptions).toHaveBeenCalledWith(undefined);
    expect(get.mock.calls[0][0]).toMatchObject({ uiMode: "immediate", publicKey: { allowCredentials: [] } });
    expect(get.mock.calls[0][0]).not.toHaveProperty("signal");
    expect(get.mock.calls[0][0]).not.toHaveProperty("mediation");
    expect(await result).toBe("authenticated");
    expect(success).toHaveBeenCalledTimes(1);
  });

  it.each([null, "NotAllowedError"])("falls back to conditional autofill after immediate %s", async (outcome) => {
    await controller.prepareImmediate();
    if (outcome) get.mockRejectedValueOnce(new DOMException("no local credential", outcome));
    else get.mockResolvedValueOnce(null);
    const fallback = jest.fn();
    const ready = jest.fn();
    expect(await controller.authenticate({ mode: "immediate", event: gesture, onFallback: fallback, onConditionalReady: ready })).toBe(
      "fallback",
    );
    await flush();
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(ready).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenNthCalledWith(2, expect.objectContaining({ mediation: "conditional", signal: expect.anything() }));
    expect(success).toHaveBeenCalledTimes(1);
  });

  it.each([false, undefined])("requires a genuine active gesture (%s)", async (isTrusted) => {
    await controller.prepareImmediate();
    await controller.authenticate({ mode: "immediate", event: { isTrusted } as Event });
    await flush();
    expect(get.mock.calls.every(([request]) => request.uiMode === undefined)).toBe(true);
  });

  it("does not invoke immediate UI after transient activation expires", async () => {
    await controller.prepareImmediate();
    Object.defineProperty(navigator, "userActivation", { configurable: true, value: { isActive: false } });
    await controller.authenticate({ mode: "immediate", event: gesture });
    await flush();
    expect(get.mock.calls.every(([request]) => request.uiMode === undefined)).toBe(true);
  });

  it("discards stale prefetched options and includes fetch latency in their lifetime", async () => {
    const clock = jest.spyOn(Date, "now").mockReturnValue(100);
    await controller.prepareImmediate();
    clock.mockReturnValue(60101);
    await controller.authenticate({ mode: "immediate", event: gesture });
    await flush();
    expect(get.mock.calls[0][0]).toHaveProperty("mediation", "conditional");
    await controller.cancel();
    authStore.setAuthenticated(false);
    const delayed = deferred<[null, typeof options]>();
    fetchOptions.mockReturnValueOnce(delayed.promise);
    const preparation = controller.prepareImmediate();
    await flush();
    clock.mockReturnValue(120102);
    delayed.resolve([null, options]);
    expect(await preparation).toBe(false);
  });

  it("waits for a cancelled delayed challenge fetch before fetching a replacement", async () => {
    const delayed = deferred<[null, typeof options]>();
    fetchOptions.mockReturnValueOnce(delayed.promise);
    const preparation = controller.prepareImmediate();
    await flush();
    const standard = controller.authenticate({ discoverable: true });
    await flush();
    expect(fetchOptions).toHaveBeenCalledTimes(1);
    delayed.resolve([null, options]);
    expect(await preparation).toBe(false);
    expect(await standard).toBe("authenticated");
    expect(fetchOptions).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).not.toHaveProperty("uiMode");
  });

  it("aborts and drains conditional get before replacing its challenge with standard UI", async () => {
    const pending = deferred<null>();
    get.mockReturnValueOnce(pending.promise);
    const listening = controller.authenticate({ mode: "conditional" });
    await flush();
    expect(authState.loading).toBe(false);
    const signal = get.mock.calls[0][0].signal as AbortSignal;
    const standard = controller.authenticate({ discoverable: true });
    expect(signal.aborted).toBe(true);
    await flush();
    expect(fetchOptions).toHaveBeenCalledTimes(1);
    pending.resolve(null);
    expect(await listening).toBe("cancelled");
    expect(await standard).toBe("authenticated");
    expect(fetchOptions).toHaveBeenCalledTimes(2);
  });

  it.each(["step", "close", "competing", "authenticated"])("ignores stale conditional completion after %s", async (cause) => {
    const pending = deferred<typeof credential>();
    get.mockReturnValueOnce(pending.promise);
    const result = controller.authenticate({ mode: "conditional" });
    await flush();
    const signal = get.mock.calls[0][0].signal as AbortSignal;
    if (cause === "step") authStore.setStep("verification");
    if (cause === "close") void controller.cancel();
    if (cause === "competing") authStore.setLoading(true);
    if (cause === "authenticated") authStore.setAuthenticated(true);
    expect(signal.aborted).toBe(true);
    pending.resolve(credential);
    expect(await result).toBe("cancelled");
    expect(verify).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
  });

  it("drains unabortable immediate UI after closing, without accepting its stale assertion", async () => {
    await controller.prepareImmediate();
    const pending = deferred<typeof credential>();
    get.mockReturnValueOnce(pending.promise);
    const result = controller.authenticate({ mode: "immediate", event: gesture });
    const cancellation = controller.cancel();
    const standard = controller.authenticate({ discoverable: true });
    await flush();
    expect(fetchOptions).toHaveBeenCalledTimes(1);
    pending.resolve(credential);
    await cancellation;
    expect(await result).toBe("cancelled");
    expect(await standard).toBe("authenticated");
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it("prevents repeated foreground clicks and duplicate verification", async () => {
    await controller.prepareImmediate();
    const pending = deferred<typeof credential>();
    get.mockReturnValueOnce(pending.promise);
    const first = controller.authenticate({ mode: "immediate", event: gesture });
    expect(await controller.authenticate({ mode: "immediate", event: gesture })).toBe("busy");
    expect(await controller.authenticate()).toBe("busy");
    pending.resolve(credential);
    expect(await first).toBe("authenticated");
    expect(verify).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledTimes(1);
  });

  it.each(["standard", "immediate", "conditional"] as const)("keeps SecurityError visible in %s mode", async (mode) => {
    if (mode === "immediate") await controller.prepareImmediate();
    get.mockRejectedValueOnce(new DOMException("RP ID does not match current origin", "SecurityError"));
    expect(await controller.authenticate({ mode, event: gesture })).toBe("error");
    expect(authState.errors.passkey).toBe("passkey_security_error");
    expect(authState.loading).toBe(false);
    expect(verify).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("keeps backend verification failures visible instead of treating them as missing credentials", async () => {
    verify.mockResolvedValueOnce(["verification_failed", {}]);
    expect(await controller.authenticate({ mode: "conditional" })).toBe("error");
    expect(authState.globalErrors.auth).toBe("verification_failed");
    expect(authState.loading).toBe(false);
    expect(success).not.toHaveBeenCalled();
  });

  it("ignores a verification response arriving after cancellation", async () => {
    const pending = deferred<[null, typeof token]>();
    verify.mockReturnValueOnce(pending.promise);
    const result = controller.authenticate({ mode: "conditional" });
    await flush();
    expect(verify).toHaveBeenCalledTimes(1);
    void controller.cancel();
    pending.resolve([null, token]);
    expect(await result).toBe("cancelled");
    expect(success).not.toHaveBeenCalled();
  });

  it.each(["missing", "false", "throws", "no-webauthn"])(
    "leaves manual login available with conditional capability %s",
    async (variant) => {
      if (variant === "missing") delete window.PublicKeyCredential.isConditionalMediationAvailable;
      if (variant === "false") conditional.mockResolvedValue(false);
      if (variant === "throws") conditional.mockRejectedValue(new Error("probe failed"));
      if (variant === "no-webauthn") Object.defineProperty(window, "PublicKeyCredential", { value: undefined });
      expect(await controller.authenticate({ mode: "conditional" })).toBe("unavailable");
      expect(authState.loading).toBe(false);
      expect(fetchOptions).not.toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
    },
  );

  it("preserves standard email-first options by default", async () => {
    authStore.setSignInId("typed-sid");
    fetchOptions.mockResolvedValueOnce([null, { ...options, allowCredentials: [{ type: "public-key", id: "YWJj" }] }]);
    expect(await controller.authenticate()).toBe("authenticated");
    expect(fetchOptions).toHaveBeenCalledWith({ signInId: "typed-sid" });
    expect(get.mock.calls[0][0].publicKey.allowCredentials).toHaveLength(1);
    expect(get.mock.calls[0][0]).not.toHaveProperty("mediation");
    expect(get.mock.calls[0][0]).not.toHaveProperty("uiMode");
  });

  it("retains challenge-fetch failures without invoking WebAuthn", async () => {
    fetchOptions.mockResolvedValueOnce(["bad_request", {}]);
    expect(await controller.prepareImmediate()).toBe(false);
    expect(authState.errors.passkey).toBe("bad_request");
    expect(authState.loading).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it("prefers an explicit response sid to the JWT fallback", async () => {
    verify.mockResolvedValueOnce([null, { ...token, sid: "explicit-sid" }]);
    expect(await controller.authenticate()).toBe("authenticated");
    expect(authState.sid).toBe("explicit-sid");
  });

  it("keeps standard cancellation visible and conditional dismissal quiet", async () => {
    get.mockRejectedValueOnce(new DOMException("dismissed", "NotAllowedError"));
    expect(await controller.authenticate()).toBe("error");
    expect(authState.errors.passkey).toBe("passkey_cancelled");
    authStore.clearErrors();
    get.mockRejectedValueOnce(new DOMException("dismissed", "NotAllowedError"));
    expect(await controller.authenticate({ mode: "conditional" })).toBe("cancelled");
    expect(authState.errors.passkey).toBeNull();
  });

  it("completes the normal sid/JWT/refresh-token session and emits authEvent exactly once", async () => {
    const helpers = new AuthHelpers(client);
    const events = jest.fn();
    document.addEventListener("authEvent", events);
    authStore.setEmail("typed@example.com");
    expect(await helpers.authenticateWithPasskey({ mode: "conditional" })).toBe("authenticated");
    expect(authState.sid).toBe("asserted-sid");
    expect(authState.email).toBe("asserted@example.com");
    expect(authState.token).toBe(token.jwt);
    expect(authState.refreshToken).toBe(token.refresh_token);
    expect(authState.authenticated).toBe(true);
    expect(authState.loading).toBe(false);
    expect(localStorage.getItem("unidy_signin_id")).toBe("asserted-sid");
    expect(sessionStorage.getItem("unidy_token")).toBe(token.jwt);
    expect(localStorage.getItem("unidy_refresh_token")).toBe(token.refresh_token);
    expect(events).toHaveBeenCalledTimes(1);
    document.removeEventListener("authEvent", events);
    await helpers.cancelPasskeyAuthentication();
  });
});
