import { jwtDecode } from "jwt-decode";
import type { PasskeyOptionsResponse, TokenResponse, UnidyClient } from "../api";
import { onChange as onRegistrationChange, registrationState, registrationStore } from "../registration/store/registration-store";
import { captchaManager } from "../shared/captcha";
import { decodeBase64Url, isWebAuthnSupported, PASSKEY_ERRORS } from "../shared/passkey-utils";
import type { TokenPayload } from "./auth";
import { authState, authStore, onChange } from "./store/auth-store";

export type PasskeySignInMode = "standard" | "immediate" | "conditional";

export interface PasskeySignInOptions {
  /** Standard modal authentication by default. Immediate automatically falls back to conditional autofill. */
  mode?: PasskeySignInMode;
  /** Omit the current sign-in ID in standard mode, allowing the assertion to identify the account. */
  discoverable?: boolean;
  /** The trusted click/keyboard event currently being handled. Required for immediate mode. */
  event?: Event;
  /** Show/focus your email UI when immediate authentication is unavailable or returns no credential. */
  onFallback?: () => void;
  /** Called after conditional listening begins; refocus an already-focused webauthn input to refresh autofill. */
  onConditionalReady?: () => void;
}

export type PasskeySignInResult = "authenticated" | "fallback" | "unavailable" | "cancelled" | "error" | "busy";
/** Options for starting a new registration after an authoritative account_not_found lookup. */
export interface PasskeyContinuationOptions {
  /** Registration resume/confirmation destination. Required to start a new flow. */
  registrationUrl: string;
  /** Optional brand ID for the new registration flow. */
  brandId?: number;
  /** Explicitly replace a saved local draft after a new flow is created successfully. Does not cancel the saved server flow. */
  replaceStoredRegistration?: boolean;
}
export type PasskeyContinuationResult = PasskeySignInResult | "verification" | "registration";
/** @internal Lifecycle lease for an SDK registration ceremony. */
export interface PasskeyRegistrationContext {
  signal: AbortSignal;
  isCurrent: () => boolean;
}
type Result = PasskeyContinuationResult | "ready" | "registered";
type Operation = {
  kind: PasskeySignInMode | "prepare" | "continue" | "registration";
  changingStep?: boolean;
  controller?: AbortController;
  loading: boolean;
};

function buildPublicKeyOptions(options: PasskeyOptionsResponse, discoverable: boolean): PublicKeyCredentialRequestOptions {
  return {
    challenge: decodeBase64Url(options.challenge).buffer as ArrayBuffer,
    timeout: options.timeout || 60000,
    rpId: options.rpId,
    userVerification: (options.userVerification as UserVerificationRequirement) || "required",
    // Immediate requests must never carry an allowlist. Conditional requests also identify the account by assertion.
    allowCredentials: discoverable ? [] : options.allowCredentials?.map((cred) => ({ ...cred, id: decodeBase64Url(cred.id) })),
  };
}

function formatCredentialForServer(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAssertionResponse;
  const encode = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return {
    id: credential.id,
    rawId: encode(credential.rawId),
    response: {
      authenticatorData: encode(response.authenticatorData),
      clientDataJSON: encode(response.clientDataJSON),
      signature: encode(response.signature),
    },
    type: credential.type,
  };
}

/** Coordinates the browser Auth singleton's sign-in ceremonies, including challenge fetches and verification. */
export class PasskeyAuth {
  private active?: Operation;
  private pending?: Promise<Result>;
  private prepared?: { publicKey: PublicKeyCredentialRequestOptions; expiresAt: number };
  private cleanups: (() => void)[] = [];
  private revision = 0;

  constructor(
    private client: UnidyClient,
    private onSuccess: (response: TokenResponse) => void,
  ) {}

  /** Invalidate synchronously; drain even unabortable immediate UI and in-flight cookie-writing HTTP requests. */
  cancel(): Promise<void> {
    this.revision++;
    this.prepared = undefined;
    const operation = this.active;
    this.active = undefined;
    this.unwatch();
    operation?.controller?.abort();
    if (operation?.loading) authStore.setLoading(false);
    return this.pending?.then(() => undefined) ?? Promise.resolve();
  }

  private unwatch() {
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups = [];
  }

  private watch() {
    this.unwatch();
    this.cleanups = [
      onChange("step", () => {
        if (!this.active?.changingStep) void this.cancel();
      }),
      onChange("authenticated", (authenticated) => {
        if (authenticated) void this.cancel();
      }),
      onChange("loading", (loading) => {
        if (loading && !this.active?.loading) void this.cancel();
      }),
    ];
    if (this.active?.kind === "registration") {
      this.cleanups.push(
        onRegistrationChange("rid", () => void this.cancel()),
        onRegistrationChange("currentStepName", () => void this.cancel()),
      );
    }
  }

  private current(operation: Operation) {
    return this.active === operation && !authState.authenticated;
  }

  private foreground() {
    return (this.active && this.active.kind !== "prepare" && this.active.kind !== "conditional") || this.active?.loading;
  }

  private launch(kind: Operation["kind"], run: (operation: Operation) => Promise<Result>, synchronous = false): Promise<Result> {
    const previous = this.cancel();
    const operation: Operation = {
      kind,
      loading: false,
      // Immediate UI prohibits an AbortSignal. Cancellation invalidates its result and waits for settlement instead.
      controller: kind === "immediate" ? undefined : new AbortController(),
    };
    this.active = operation;
    this.watch();
    const execute = () => (this.current(operation) ? run(operation) : Promise.resolve<Result>("cancelled"));
    const task = (synchronous ? execute() : previous.then(execute))
      .catch((error: unknown): Result => {
        if (!this.current(operation)) return "cancelled";
        const name = error instanceof Error || error instanceof DOMException ? error.name : "";
        if ((kind === "immediate" || kind === "conditional") && (name === "NotAllowedError" || name === "AbortError")) {
          return kind === "immediate" ? "fallback" : "cancelled";
        }
        if (kind === "registration") registrationStore.setFieldError("passkey", PASSKEY_ERRORS[name] || "passkey_error");
        else authStore.setFieldError("passkey", PASSKEY_ERRORS[name] || "passkey_error");
        return "error";
      })
      .finally(() => {
        if (this.active === operation) {
          this.active = undefined;
          if (!this.prepared) this.unwatch();
          if (operation.loading) authStore.setLoading(false);
        }
        if (this.pending === task) this.pending = undefined;
      });
    this.pending = task;
    return task;
  }

  /** Prefetch discoverable options, capped at 60s from request start (including network latency). */
  async prepareImmediate(): Promise<boolean> {
    if (!isWebAuthnSupported() || authState.authenticated || authState.loading || this.foreground()) return false;
    if (this.active?.kind === "prepare") return (await this.pending) === "ready";
    if (this.prepared && this.prepared.expiresAt > Date.now()) return true;
    return (
      (await this.launch("prepare", async (operation) => {
        let supported = false;
        try {
          supported = (await window.PublicKeyCredential.getClientCapabilities?.())?.immediateGet === true;
        } catch {
          // Missing/failed capability detection must never lead to an unknown uiMode opening a modal prompt.
        }
        if (!this.current(operation)) return "cancelled";
        if (!supported) return "unavailable";
        const startedAt = Date.now();
        const publicKey = await this.fetchOptions(operation, true);
        if (!this.current(operation)) return "cancelled";
        if (!publicKey) return "error";
        const expiresAt = startedAt + Math.min(publicKey.timeout || 60000, 60000);
        if (expiresAt <= Date.now()) return "unavailable";
        this.prepared = { publicKey, expiresAt };
        return "ready";
      })) === "ready"
    );
  }

  authenticate(options: PasskeySignInOptions = {}): Promise<PasskeySignInResult> {
    if (authState.authenticated || authState.loading || this.foreground()) return Promise.resolve("busy");
    const mode = options.mode ?? "standard";
    if (mode === "immediate") {
      const prepared = this.prepared;
      if (
        !options.event?.isTrusted ||
        navigator.userActivation?.isActive !== true ||
        !prepared ||
        prepared.expiresAt <= Date.now() ||
        this.pending
      ) {
        return Promise.resolve(this.fallback(options));
      }
      const task = this.launch(mode, (operation) => this.request(operation, prepared.publicKey, options), true);
      const revision = this.revision;
      return task.then((result) => {
        if (result === "fallback" && revision === this.revision) return this.fallback(options);
        return result as PasskeySignInResult;
      });
    }
    if (mode === "conditional" && this.active?.kind === "conditional") return Promise.resolve("busy");
    return this.launch(mode, async (operation) => {
      if (!isWebAuthnSupported()) {
        if (mode === "standard") authStore.setFieldError("passkey", "passkey_not_supported");
        return "unavailable";
      }
      if (mode === "conditional") {
        let supported = false;
        try {
          supported = (await window.PublicKeyCredential.isConditionalMediationAvailable?.()) === true;
        } catch {
          // Conditional UI is optional; capability probe failures leave the manual form usable.
        }
        if (!this.current(operation)) return "cancelled";
        if (!supported) return "unavailable";
      } else {
        this.setLoading(operation);
        authStore.clearErrors();
      }
      const publicKey = await this.fetchOptions(operation, mode === "conditional" || options.discoverable === true);
      if (!this.current(operation)) return "cancelled";
      if (!publicKey) return "error";
      return this.request(operation, publicKey, options);
    }) as Promise<PasskeySignInResult>;
  }

  /** Resolve typed email through the normal lookup; email alone never authorizes enrollment for an existing account. */
  continueWithEmail(
    email: string,
    options: PasskeyContinuationOptions | undefined,
    onError: (error: string, response: unknown) => void,
  ): Promise<PasskeyContinuationResult> {
    if (authState.authenticated || authState.loading || registrationState.loading || registrationState.submitting || this.foreground())
      return Promise.resolve("busy");
    email = email.trim().toLowerCase();
    // Mirror an email input's basic shape check; the backend remains authoritative about accepted addresses.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      authStore.setFieldError("email", "invalid_email");
      return Promise.resolve("error");
    }
    return this.launch("continue", async (operation) => {
      this.setLoading(operation);
      authStore.clearErrors();
      authStore.setEmail(email);
      authStore.setBrands([]);
      let captchaToken: string | undefined;
      try {
        captchaToken = (await captchaManager.execute("login"))?.token;
      } catch {
        if (this.current(operation)) authStore.setGlobalError("captcha", "captcha_execution_failed");
        return "error";
      }
      if (!this.current(operation)) return "cancelled";
      const [error, response] = await this.client.auth.createSignIn({ payload: { email, originUrl: window.location.href, captchaToken } });
      if (!this.current(operation)) return "cancelled";
      if (error === "account_not_found") {
        if (!options?.registrationUrl) {
          authStore.setGlobalError("auth", "registration_not_configured");
          return "error";
        }
        // Never silently replace or enroll into a previously stored registration flow.
        const storedRid = registrationState.rid;
        if (storedRid && !options.replaceStoredRegistration) {
          authStore.setGlobalError("auth", "registration_flow_already_exists");
          return "error";
        }
        const [registrationError, flow] = await this.client.auth.createRegistration({
          email,
          registration_url: options.registrationUrl,
          ...(options.brandId ? { brand_id: options.brandId } : {}),
        });
        if (!this.current(operation) || registrationState.rid !== storedRid) return "cancelled";
        if (registrationError || !flow || !("rid" in flow)) {
          // A lookup/create race returning email_already_registered must never fall through to enrollment.
          authStore.setGlobalError("auth", registrationError || "bad_request");
          return "error";
        }
        // This is a different account/flow. setFlowResponse intentionally merges partial updates,
        // so reset all previous draft values first, retaining the integration's configured steps.
        const steps = registrationState.steps;
        registrationStore.reset();
        registrationStore.setSteps(steps);
        registrationStore.setRid(flow.rid);
        registrationStore.setEmail(email);
        registrationStore.setPasskeyIntent(true);
        registrationStore.clearErrors();
        registrationStore.setFlowResponse(flow);
        registrationStore.setCurrentStepIndex(0);
        this.transition(operation, () => authStore.setStep("registration"));
        return "registration";
      }
      if (error || !response || !("login_options" in response) || !("password" in response.login_options)) {
        this.transition(operation, () => onError(error || "bad_request", response));
        return "error";
      }
      authStore.setSignInId(response.sid);
      authStore.setLoginOptions(response.login_options);
      authStore.setBrands(response.brands ?? []);
      this.transition(operation, () => authStore.setStep("verification"));
      if (!response.login_options.passkey || !isWebAuthnSupported()) return "verification";
      // An empty account allowlist must not degrade this action into an unrelated discoverable prompt.
      const publicKey = await this.fetchOptions(operation, false);
      if (!this.current(operation)) return "cancelled";
      if (!publicKey) return "error";
      if (!publicKey.allowCredentials?.length) return "verification";
      return this.request(operation, publicKey, { mode: "standard" }, onError);
    }) as Promise<PasskeyContinuationResult>;
  }

  private transition(operation: Operation, update: () => void) {
    operation.changingStep = true;
    try {
      update();
    } finally {
      operation.changingStep = false;
    }
  }

  /** @internal Share the same queue and cancellation lease with registration credentials.create(). */
  async register(run: (context: PasskeyRegistrationContext) => Promise<boolean>): Promise<boolean> {
    if (authState.authenticated || authState.loading || this.foreground()) return false;
    return (
      (await this.launch("registration", async (operation) => {
        return (await run({ signal: operation.controller.signal, isCurrent: () => this.current(operation) })) ? "registered" : "error";
      })) === "registered"
    );
  }

  private fallback(options: PasskeySignInOptions): PasskeySignInResult {
    options.onFallback?.();
    void this.authenticate({ mode: "conditional", onConditionalReady: options.onConditionalReady });
    return "fallback";
  }

  private setLoading(operation: Operation) {
    operation.loading = true;
    authStore.setLoading(true);
  }

  private async fetchOptions(operation: Operation, discoverable: boolean) {
    const [error, options] = await this.client.auth.getPasskeyOptions(
      !discoverable && authState.sid ? { signInId: authState.sid } : undefined,
    );
    if (!this.current(operation)) return undefined;
    if (error || !options || !("challenge" in options)) {
      authStore.setFieldError("passkey", error || "bad_request");
      return undefined;
    }
    return buildPublicKeyOptions(options, discoverable);
  }

  private async request(
    operation: Operation,
    publicKey: PublicKeyCredentialRequestOptions,
    options: PasskeySignInOptions,
    onError?: (error: string, response: unknown) => void,
  ): Promise<Result> {
    if (operation.kind !== "conditional") {
      this.setLoading(operation);
      authStore.clearErrors();
    }
    const request: CredentialRequestOptions & { uiMode?: "immediate" } = { publicKey };
    if (operation.kind === "immediate") request.uiMode = "immediate";
    else request.signal = operation.controller.signal;
    if (operation.kind === "conditional") request.mediation = "conditional";
    // No awaits before get(): immediate must retain the trusted event's transient activation.
    const credentialRequest = navigator.credentials.get(request);
    if (operation.kind === "conditional") options.onConditionalReady?.();
    const credential = (await credentialRequest) as PublicKeyCredential | null;
    if (!this.current(operation)) return "cancelled";
    if (!credential) {
      if (operation.kind === "immediate") return "fallback";
      if (operation.kind === "standard") authStore.setFieldError("passkey", "passkey_cancelled");
      return "cancelled";
    }
    this.setLoading(operation);
    authStore.clearErrors();
    const [error, response] = await this.client.auth.authenticateWithPasskey({
      payload: { credential: formatCredentialForServer(credential) },
    });
    if (!this.current(operation)) return "cancelled";
    if (error || !response || !("jwt" in response)) {
      if (onError) this.transition(operation, () => onError(error || "authentication_failed", response));
      else authStore.setGlobalError("auth", error || "authentication_failed");
      return "error";
    }
    // Stop cancellation subscriptions before normal session completion changes authenticated/step/loading.
    this.unwatch();
    this.active = undefined;
    let payload: TokenPayload | undefined;
    try {
      payload = jwtDecode<TokenPayload>(response.jwt);
    } catch {
      // Older integrations can supply an opaque token with an explicit sid.
    }
    const sid = response.sid || payload?.sid;
    if (sid) authStore.setSignInId(sid);
    if (payload?.email) authStore.setEmail(payload.email);
    this.onSuccess(response);
    return "authenticated";
  }
}
