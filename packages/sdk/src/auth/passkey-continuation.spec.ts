import type { UnidyClient } from "../api";
import type { ApiClientInterface } from "../api/base-service";
import { RegistrationStep } from "../registration/components/registration-step/registration-step";
import { RegistrationHelpers } from "../registration/registration-helpers";
import { registrationState, registrationStore } from "../registration/store/registration-store";
import { AuthService } from "./api";
import type { RegistrationFlowResponse } from "./api/register";
import { Auth } from "./auth";
import { AuthHelpers } from "./auth-helpers";
import { authState, authStore } from "./store/auth-store";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};
const flush = async () => {
  for (let i = 0; i < 18; i++) await Promise.resolve();
};
const encode = (value: object) => btoa(JSON.stringify(value));
const token = {
  jwt: `e30.${encode({ sid: "asserted-sid", sub: "asserted-user", email: "asserted@example.com" })}.sig`,
  refresh_token: "refresh",
};
const flow = (extra: Partial<RegistrationFlowResponse> = {}): RegistrationFlowResponse => ({
  rid: "new-rid",
  email: "new@example.com",
  has_passkey: false,
  has_password: false,
  email_verified: false,
  social_provider: null,
  newsletter_preferences: {},
  registration_profile_data: {},
  status: {},
  can_finalize: false,
  expired: false,
  created_at: "2026-11-05",
  updated_at: "2026-11-05",
  expires_at: "2026-11-06",
  ...extra,
});
const getOptions = {
  challenge: "Y2hhbGxlbmdl",
  timeout: 60000,
  rpId: "localhost",
  userVerification: "required",
  allowCredentials: [{ type: "public-key", id: "YWJj" }],
};
const createOptions = {
  challenge: "Y2hhbGxlbmdl",
  timeout: 60000,
  rp: { id: "localhost", name: "Unidy" },
  user: { id: "YWJj", name: "new@example.com", displayName: "New" },
  pubKeyCredParams: [{ type: "public-key", alg: -7 }],
};
const credential = {
  id: "key",
  rawId: new Uint8Array([1]).buffer,
  type: "public-key",
  response: {
    authenticatorData: new Uint8Array([2]).buffer,
    clientDataJSON: new Uint8Array([3]).buffer,
    signature: new Uint8Array([4]).buffer,
    attestationObject: new Uint8Array([5]).buffer,
  },
};
const login = (passkey: boolean) => ({
  sid: "lookup-sid",
  email: "existing@example.com",
  login_options: { passkey, password: true, magic_link: true, social_logins: ["google"] },
  brands: [],
});
const registrationOptions = { registrationUrl: "https://frontend.example.com/register", brandId: 2 };

describe("typed-email passkey continuation and enrollment (mocked WebAuthn)", () => {
  let helpers: AuthHelpers;
  let registration: RegistrationHelpers;
  let api: Record<string, jest.Mock>;
  let get: jest.Mock;
  let create: jest.Mock;

  beforeEach(() => {
    authStore.reset();
    registrationStore.reset();
    authStore.setStep("email");
    registrationStore.setSteps(["email", "passkey", "verification", "profile", "password", "newsletters"]);
    api = {
      createSignIn: jest.fn().mockResolvedValue([null, login(true)]),
      getPasskeyOptions: jest.fn().mockResolvedValue([null, getOptions]),
      authenticateWithPasskey: jest.fn().mockResolvedValue([null, token]),
      createRegistration: jest.fn().mockResolvedValue([null, flow()]),
      getPasskeyCreationOptions: jest.fn().mockResolvedValue([null, createOptions]),
      registerPasskey: jest.fn().mockResolvedValue([null, flow({ has_passkey: true })]),
      finalizeRegistration: jest.fn().mockResolvedValue([null, flow({ status: { completed: true } })]),
      updateRegistration: jest.fn().mockResolvedValue([null, flow()]),
    };
    const client = { auth: api } as unknown as UnidyClient;
    helpers = new AuthHelpers(client);
    registration = new RegistrationHelpers(client);
    jest.spyOn(Auth, "getInstance").mockResolvedValue({ helpers } as Auth);
    jest.spyOn(authStore, "getRootComponentRef").mockReturnValue(null);
    get = jest.fn().mockResolvedValue(credential);
    create = jest.fn().mockResolvedValue(credential);
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: { isConditionalMediationAvailable: () => Promise.resolve(true) },
    });
    Object.defineProperty(navigator, "credentials", { configurable: true, value: { get, create } });
  });

  afterEach(async () => {
    await registration.cancelPasskeyRegistration();
    await helpers.cancelPasskeyAuthentication();
    jest.restoreAllMocks();
  });

  it.each(["", "invalid", "x@", "x y@example.com"])("rejects invalid typed email %s without requests", async (email) => {
    expect(await helpers.continueWithPasskey(email, registrationOptions)).toBe("error");
    expect(api.createSignIn).not.toHaveBeenCalled();
    expect(api.createRegistration).not.toHaveBeenCalled();
    expect(authState.errors.email).toBe("invalid_email");
  });

  it("looks up an existing account, keeps its offered methods, and uses its allowlist", async () => {
    expect(await helpers.continueWithPasskey(" EXISTING@example.com ", registrationOptions)).toBe("authenticated");
    expect(api.createSignIn.mock.calls[0][0].payload.email).toBe("existing@example.com");
    expect(api.getPasskeyOptions).toHaveBeenCalledWith({ signInId: "lookup-sid" });
    expect(get.mock.calls[0][0].publicKey.allowCredentials).toHaveLength(1);
    expect(get.mock.calls[0][0]).not.toHaveProperty("uiMode");
    expect(authState.availableLoginOptions).toMatchObject({ password: true, magic_link: true, social_logins: ["google"] });
    expect(authState.sid).toBe("asserted-sid");
    expect(api.createRegistration).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("keeps offered manual methods when headless continuation runs without WebAuthn", async () => {
    Object.defineProperty(window, "PublicKeyCredential", { configurable: true, value: undefined });
    expect(await helpers.continueWithPasskey("existing@example.com", registrationOptions)).toBe("verification");
    expect(api.getPasskeyOptions).not.toHaveBeenCalled();
    expect(authState.availableLoginOptions.password).toBe(true);
    expect(api.createRegistration).not.toHaveBeenCalled();
  });

  it.each(["not-offered", "empty-allowlist"])(
    "never enrolls or opens an unrelated discovery prompt for existing account %s",
    async (variant) => {
      if (variant === "not-offered") api.createSignIn.mockResolvedValueOnce([null, login(false)]);
      else api.getPasskeyOptions.mockResolvedValueOnce([null, { ...getOptions, allowCredentials: [] }]);
      expect(await helpers.continueWithPasskey("existing@example.com", registrationOptions)).toBe("verification");
      expect(authState.step).toBe("verification");
      expect(authState.availableLoginOptions.password).toBe(true);
      expect(get).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(api.createRegistration).not.toHaveBeenCalled();
    },
  );

  it.each(["account_locked", "account_unconfirmed", "rate_limited"])("preserves lookup failure %s and does not register", async (error) => {
    api.createSignIn.mockResolvedValueOnce([error, {}]);
    expect(await helpers.continueWithPasskey("existing@example.com", registrationOptions)).toBe("error");
    expect(api.createRegistration).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    if (error === "account_unconfirmed") expect(authState.step).toBe("unconfirmed");
    else expect(authState.globalErrors.auth || authState.errors.email).toBe(error);
  });

  it("keeps typed-account verification failures visible alongside the offered methods", async () => {
    api.authenticateWithPasskey.mockResolvedValueOnce(["verification_failed", {}]);
    expect(await helpers.continueWithPasskey("existing@example.com", registrationOptions)).toBe("error");
    expect(authState.step).toBe("verification");
    expect(authState.globalErrors.auth).toBe("verification_failed");
    expect(api.createRegistration).not.toHaveBeenCalled();
  });

  it("does not turn a dismissed existing-account prompt into enrollment", async () => {
    get.mockRejectedValueOnce(new DOMException("cancelled", "NotAllowedError"));
    expect(await helpers.continueWithPasskey("existing@example.com", registrationOptions)).toBe("error");
    expect(authState.errors.passkey).toBe("passkey_cancelled");
    expect(authState.step).toBe("verification");
    expect(api.createRegistration).not.toHaveBeenCalled();
  });

  it("starts only a new registration flow after account_not_found and does not finalize or claim verification", async () => {
    api.createSignIn.mockResolvedValueOnce(["account_not_found", {}]);
    expect(await helpers.continueWithPasskey("new@example.com", registrationOptions)).toBe("registration");
    expect(api.createRegistration).toHaveBeenCalledWith({
      email: "new@example.com",
      registration_url: registrationOptions.registrationUrl,
      brand_id: 2,
    });
    expect(registrationState.rid).toBe("new-rid");
    expect(registrationState.passkeyIntent).toBe(true);
    expect(registrationState.passwordlessFlag).toBe(false);
    expect(registrationState.emailVerified).toBe(false);
    expect(authState.step).toBe("registration");
    expect(authState.authenticated).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(api.finalizeRegistration).not.toHaveBeenCalled();
  });

  it("does not replace an unrelated local registration flow", async () => {
    registrationStore.setRid("unrelated-rid");
    registrationStore.setProfileData({ first_name: "Existing draft" });
    api.createSignIn.mockResolvedValueOnce(["account_not_found", {}]);
    expect(await helpers.continueWithPasskey("new@example.com", registrationOptions)).toBe("error");
    expect(api.createRegistration).not.toHaveBeenCalled();
    expect(registrationState.rid).toBe("unrelated-rid");
    expect(registrationState.profileData).toEqual({ first_name: "Existing draft" });
  });

  it("keeps an email lookup/create race safe and preserves email_already_registered", async () => {
    api.createSignIn.mockResolvedValueOnce(["account_not_found", {}]);
    api.createRegistration.mockResolvedValueOnce(["email_already_registered", {}]);
    expect(await helpers.continueWithPasskey("new@example.com", registrationOptions)).toBe("error");
    expect(authState.globalErrors.auth).toBe("email_already_registered");
    expect(registrationState.rid).toBeNull();
    expect(api.getPasskeyCreationOptions).not.toHaveBeenCalled();
  });

  it.each(["close", "step"])("ignores a delayed lookup after %s", async (cause) => {
    const lookup = deferred<[string, object]>();
    api.createSignIn.mockReturnValueOnce(lookup.promise);
    const result = helpers.continueWithPasskey("new@example.com", registrationOptions);
    await flush();
    if (cause === "close") void helpers.cancelPasskeyAuthentication();
    else authStore.setStep("reset-password");
    lookup.resolve(["account_not_found", {}]);
    expect(await result).toBe("cancelled");
    expect(api.createRegistration).not.toHaveBeenCalled();
  });

  it("deduplicates typed-email continuation clicks while lookup is pending", async () => {
    const lookup = deferred<[null, ReturnType<typeof login>]>();
    api.createSignIn.mockReturnValueOnce(lookup.promise);
    const first = helpers.continueWithPasskey("existing@example.com", registrationOptions);
    expect(await helpers.continueWithPasskey("existing@example.com", registrationOptions)).toBe("busy");
    lookup.resolve([null, login(false)]);
    expect(await first).toBe("verification");
    expect(api.createSignIn).toHaveBeenCalledTimes(1);
  });

  it("coordinates creation with pending conditional listening and completes no session from collection alone", async () => {
    const listening = deferred<null>();
    get.mockReturnValueOnce(listening.promise);
    const result = helpers.authenticateWithPasskey({ mode: "conditional" });
    await flush();
    const signal = get.mock.calls[0][0].signal as AbortSignal;
    registrationStore.setRid("new-rid");
    registrationStore.setCurrentStepName("passkey");
    const enrollment = registration.registerPasskey();
    await flush();
    expect(signal.aborted).toBe(true);
    expect(api.getPasskeyCreationOptions).not.toHaveBeenCalled();
    listening.resolve(null);
    await result;
    expect(await enrollment).toBe(true);
    expect(registrationState.hasPasskey).toBe(true);
    expect(registrationState.emailVerified).toBe(false);
    expect(authState.authenticated).toBe(false);
    expect(api.finalizeRegistration).not.toHaveBeenCalled();
  });

  it("deduplicates enrollment and cancels a delayed creation challenge without accepting its result", async () => {
    registrationStore.setRid("new-rid");
    const challenge = deferred<[null, typeof createOptions]>();
    api.getPasskeyCreationOptions.mockReturnValueOnce(challenge.promise);
    const first = registration.registerPasskey();
    const second = registration.registerPasskey();
    await flush();
    const cancelled = registration.cancelPasskeyRegistration();
    challenge.resolve([null, createOptions]);
    expect(await first).toBe(false);
    expect(await second).toBe(false);
    await cancelled;
    expect(api.getPasskeyCreationOptions).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it("ignores a late creation result after leaving the registration step", async () => {
    registrationStore.setRid("new-rid");
    registrationStore.setCurrentStepName("passkey");
    const pending = deferred<typeof credential>();
    create.mockReturnValueOnce(pending.promise);
    const result = registration.registerPasskey();
    await flush();
    registrationStore.setCurrentStepName("profile");
    pending.resolve(credential);
    expect(await result).toBe(false);
    expect(api.registerPasskey).not.toHaveBeenCalled();
  });

  it.each(["NotAllowedError", "SecurityError"])("keeps creation %s visible and offers a password path", async (name) => {
    registrationStore.setRid("new-rid");
    registrationStore.setPasskeyIntent(true);
    create.mockRejectedValueOnce(new DOMException("creation failed", name));
    expect(await registration.registerPasskey()).toBe(false);
    expect(registrationState.errors.passkey).toBe(name === "SecurityError" ? "passkey_security_error" : "passkey_cancelled");
    registration.continueWithPassword();
    const passwordStep = new RegistrationStep();
    passwordStep.requiresPassword = true;
    expect(await passwordStep.shouldSkip()).toBe(false);
    expect(registrationState.passkeyIntent).toBe(false);
    expect(registrationState.errors.passkey).toBeUndefined();
  });

  it("skips password only after server-confirmed passkey collection and never skips required verification/profile", async () => {
    registrationStore.setPasskeyIntent(true);
    const passwordStep = new RegistrationStep();
    passwordStep.requiresPassword = true;
    expect(await passwordStep.shouldSkip()).toBe(false);
    registrationStore.setHasPasskey(true);
    expect(await passwordStep.shouldSkip()).toBe(true);
    const profileStep = new RegistrationStep();
    expect(await profileStep.shouldSkip()).toBe(false);
    const verificationStep = new RegistrationStep();
    verificationStep.requiresEmailVerification = true;
    expect(await verificationStep.shouldSkip()).toBe(false);
    await verificationStep.submit();
    expect(registrationState.errors.verificationCode).toBe("email_verification_required");
    expect(api.finalizeRegistration).not.toHaveBeenCalled();
  });

  it("retains an expired registration identifier while resetting the stale flow", async () => {
    registrationStore.setRid("new-rid");
    api.getPasskeyCreationOptions.mockResolvedValueOnce(["registration_expired", {}]);
    expect(await registration.registerPasskey()).toBe(false);
    expect(registrationState.rid).toBeNull();
    expect(registrationState.errors.passkey).toBe("registration_expired");
    expect(registrationState.globalErrors.registration).toBe("registration_expired");
    expect(registrationState.currentStepName).toBe("email");
  });

  it("blocks enrollment while a competing flow update is pending", async () => {
    registrationStore.setRid("new-rid");
    const update = deferred<[null, RegistrationFlowResponse]>();
    api.updateRegistration.mockReturnValueOnce(update.promise);
    const changing = registration.updateRegistration();
    await flush();
    expect(await registration.registerPasskey()).toBe(false);
    expect(api.getPasskeyCreationOptions).not.toHaveBeenCalled();
    update.resolve([null, flow()]);
    await changing;
  });

  it("drains pending creation before finalization and ignores the stale credential", async () => {
    registrationStore.setRid("new-rid");
    const pending = deferred<typeof credential>();
    create.mockReturnValueOnce(pending.promise);
    const enrollment = registration.registerPasskey();
    await flush();
    const finalizing = registration.finalizeRegistration();
    await flush();
    expect(api.finalizeRegistration).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].signal.aborted).toBe(true);
    pending.resolve(credential);
    expect(await enrollment).toBe(false);
    expect(await finalizing).toBe(true);
    expect(api.registerPasskey).not.toHaveBeenCalled();
    expect(api.finalizeRegistration).toHaveBeenCalledTimes(1);
  });

  it("preserves passkey_verification_failed from the registration backend", async () => {
    registrationStore.setRid("new-rid");
    api.registerPasskey.mockResolvedValueOnce(["passkey_verification_failed", {}]);
    expect(await registration.registerPasskey()).toBe(false);
    expect(registrationState.errors.passkey).toBe("passkey_verification_failed");
    expect(registrationState.hasPasskey).toBe(false);
  });

  it.each([false, true])("only completes normal registration auth when the backend supplies tokens (%s)", async (authenticated) => {
    registrationStore.setRid("new-rid");
    const events = jest.fn();
    document.addEventListener("authEvent", events);
    api.finalizeRegistration.mockResolvedValueOnce([
      null,
      flow({
        status: { completed: true },
        ...(authenticated ? { auth: { id_token: token.jwt, refresh_token: token.refresh_token } } : {}),
      }),
    ]);
    expect(await registration.finalizeRegistration()).toBe(true);
    expect(authState.authenticated).toBe(authenticated);
    expect(events).toHaveBeenCalledTimes(authenticated ? 1 : 0);
    if (authenticated) {
      expect(authState.sid).toBe("asserted-sid");
      expect(authState.refreshToken).toBe("refresh");
    }
    document.removeEventListener("authEvent", events);
  });
});

describe("passkey API error identifiers", () => {
  const response = (data: object) => ({ success: false, status: 422, headers: new Headers(), data });
  it("preserves an options error instead of rewriting it to bad_request", async () => {
    const api = new AuthService({
      get: jest.fn().mockResolvedValue(response({ error_identifier: "origin_not_allowed" })),
    } as unknown as ApiClientInterface);
    expect((await api.getPasskeyOptions())[0]).toBe("origin_not_allowed");
  });
  it("preserves registration verification errors", async () => {
    const api = new AuthService({
      baseUrl: "https://backend.example.com",
      post: jest.fn().mockResolvedValue(response({ error_identifier: "passkey_verification_failed" })),
    } as unknown as ApiClientInterface);
    expect((await api.registerPasskey({ publicKeyCredential: {} }, { rid: "rid" }))[0]).toBe("passkey_verification_failed");
  });
  it("retains modern cannot_finalize metadata for required-profile/auth-method errors", async () => {
    const api = new AuthService({
      baseUrl: "https://backend.example.com",
      post: jest
        .fn()
        .mockResolvedValue(
          response({ error_identifier: "cannot_finalize", meta: { missing_fields: ["first_name"], auth_method_missing: true } }),
        ),
    } as unknown as ApiClientInterface);
    const [error, result] = await api.finalizeRegistration({ rid: "rid" });
    expect(error).toBe("cannot_finalize");
    expect(result).toMatchObject({ missing_fields: ["first_name"], auth_method_missing: true });
  });
});
