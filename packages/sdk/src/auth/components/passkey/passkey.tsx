import { Component, Element, Host, h, Prop, State, Watch } from "@stencil/core";
import { t } from "../../../i18n";
import { registrationState } from "../../../registration/store/registration-store";
import { Auth } from "../../auth";
import type { PasskeySignInMode } from "../../passkey-auth";
import { authState, authStore, onChange } from "../../store/auth-store";
import { PasskeyIcon } from "./passkey-icon";

const ICON_CLASSNAME = "u:w-5 u:h-5 u:block";

@Component({
  tag: "u-passkey",
  styleUrl: "passkey.css",
  shadow: false,
})
export class Passkey {
  @Element() element!: HTMLElement;
  /** Disable this button and stop its automatic passkey flow. */
  @Prop() disabled = false;
  /** CSS classes to apply to the button element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";
  /** ID of an element describing the passkey button. */
  @Prop() ariaDescribedBy? = "";
  /** Allow account discovery without an email lookup. Immediate and conditional modes always use discovery. */
  @Prop() discoverable = false;
  /** Standard modal UI by default. Opt in to immediate UI with conditional autofill fallback, or conditional autofill alone. */
  @Prop() mode: PasskeySignInMode = "standard";
  /** Set false when closing or hiding a sign-in modal to cancel pending requests and discard prefetched challenges. */
  @Prop() active = true;
  /** Opt in to typed-email account lookup and new-account passkey registration via a sibling u-registration-root. */
  @Prop() continueWithPasskey = false;

  @State() isSupported = false;
  @State() preparing = false;
  @State() initialized = false;
  @State() continuing = false;

  private auth?: Auth;
  private revision = 0;
  private cleanups: (() => void)[] = [];

  connectedCallback() {
    this.initialized = false;
    this.isSupported = typeof window !== "undefined" && !!window.PublicKeyCredential;
    // Store listeners run synchronously over a mutable array. Start the next flow after the change
    // finishes, so newly registered cancellation listeners cannot receive the change that created them.
    const configure = () =>
      queueMicrotask(() => {
        if (this.element.isConnected) this.configure();
      });
    this.cleanups = [onChange("step", configure), onChange("authenticated", configure)];
    const revision = ++this.revision;
    void Auth.getInstance().then(async (auth) => {
      await auth.ready;
      if (!this.element.isConnected || revision !== this.revision) return;
      this.auth = auth;
      this.initialized = true;
      this.configure();
    });
  }

  disconnectedCallback() {
    this.revision++;
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups = [];
    void this.auth?.helpers.cancelPasskeyAuthentication();
  }

  @Watch("active")
  @Watch("disabled")
  configure() {
    // A standard button may coexist with the automatic flow; it must not cancel that flow just by rendering.
    if (!this.auth) return;
    if (!this.active || this.disabled) {
      void this.auth.helpers.cancelPasskeyAuthentication();
      this.preparing = false;
      this.revision++;
      return;
    }
    if (this.mode === "standard") return;
    const revision = ++this.revision;
    this.preparing = false;
    if (!this.canListen()) return;
    if (this.mode === "conditional") {
      void this.auth.helpers.authenticateWithPasskey({ mode: "conditional", onConditionalReady: this.refocusEmail });
      return;
    }
    this.preparing = true;
    void this.auth.helpers.prepareImmediatePasskey().then((ready) => {
      if (revision !== this.revision) return;
      this.preparing = false;
      if (!this.canListen()) return;
      if (!ready) {
        this.focusEmail();
        void this.auth.helpers.authenticateWithPasskey({ mode: "conditional", onConditionalReady: this.refocusEmail });
      }
    });
  }

  @Watch("mode")
  modeChanged() {
    void this.auth?.helpers.cancelPasskeyAuthentication();
    this.configure();
  }

  private canListen() {
    const step = this.element.closest("u-signin-step");
    return (
      this.element.isConnected &&
      this.active &&
      !this.disabled &&
      this.isSupported &&
      !authState.authenticated &&
      !authState.loading &&
      (!step || step.name === authState.step)
    );
  }

  private emailField() {
    return this.element.closest("u-signin-root")?.querySelector<HTMLInputElement>('u-email-field input[type="email"]');
  }

  private focusEmail = () => {
    const field = this.element.closest("u-signin-root")?.querySelector("u-email-field");
    const revision = this.revision;
    const focused = document.activeElement;
    // Lazy hydration and ancestor hidden-state renders may finish after capability detection.
    // Wait for the input to exist and become visible, without taking focus after another interaction.
    void field?.componentOnReady().then(() => {
      requestAnimationFrame(() => {
        if (revision !== this.revision || !this.canListen() || document.activeElement !== focused) return;
        this.emailField()?.focus();
      });
    });
  };

  private refocusEmail = () => {
    const field = this.emailField();
    if (field?.autocomplete.includes("webauthn") && document.activeElement === field) {
      field.blur();
      field.focus();
    }
  };

  private handleClick = (event: MouseEvent) => {
    if (!this.active || this.disabled || this.continuing || authState.loading || !this.isSupported || !this.auth) return;
    const email = this.emailField();
    if (this.continueWithPasskey && email?.value.trim()) {
      authStore.setEmail(email.value.trim());
      if (!email.reportValidity()) return;
      this.continueWithEmail();
      return;
    }
    if (this.preparing) return;
    if (this.mode === "conditional") {
      this.focusEmail();
      void this.auth.helpers.authenticateWithPasskey({ mode: "conditional", onConditionalReady: this.refocusEmail });
      return;
    }
    // Keep this synchronous: awaiting Auth.getInstance() here would lose the immediate call's user gesture.
    void this.auth.helpers.authenticateWithPasskey({
      mode: this.mode,
      discoverable: this.discoverable,
      event,
      onFallback: this.focusEmail,
      onConditionalReady: this.refocusEmail,
    });
  };

  private continueWithEmail = (replaceStoredRegistration = false) => {
    const email = this.emailField();
    if (!this.active || this.disabled || this.continuing || authState.loading || !this.auth || !email?.reportValidity()) return;
    this.continuing = true;
    const root = this.element.closest("u-signin-root")?.querySelector("u-registration-root");
    void (async () => {
      const options = root
        ? { registrationUrl: await root.getRegistrationUrl(), brandId: await root.getBrandId(), replaceStoredRegistration }
        : undefined;
      if (!this.active || !this.element.isConnected) return;
      const result = await this.auth.helpers.continueWithPasskey(email.value, options);
      if (result === "registration" && root && this.active && this.element.isConnected) await root.advanceToNextStep();
      else if (authState.step === "verification")
        requestAnimationFrame(() => {
          if (!this.active || !this.element.isConnected || authState.step !== "verification") return;
          const focused = document.activeElement;
          if (focused !== document.body && !focused?.closest("u-signin-step")?.hidden) return;
          this.element
            .closest("u-signin-root")
            ?.querySelector<HTMLElement>(
              'u-signin-step[name="verification"] input:not([disabled]), u-signin-step[name="verification"] button:not([disabled])',
            )
            ?.focus();
        });
    })().finally(() => {
      this.continuing = false;
    });
  };

  render() {
    if ((!this.discoverable && this.mode === "standard" && !authState.availableLoginOptions?.passkey) || !this.isSupported) return null;

    const typedEmail = this.continueWithPasskey && !!authState.email.trim();
    const isDisabled =
      !this.initialized || !this.active || this.disabled || this.continuing || authState.loading || (this.preparing && !typedEmail);
    const text = typedEmail
      ? t("auth.passkey.continue_with_passkey", { defaultValue: "Continue with passkey" })
      : t("auth.passkey.button_text", { defaultValue: "Sign in with Passkey" });
    const loadingText = t("auth.passkey.loading_text", { defaultValue: "Authenticating..." });

    return (
      <Host>
        <button
          type="button"
          aria-disabled={isDisabled ? "true" : undefined}
          aria-busy={(this.preparing && !typedEmail) || this.continuing || authState.loading ? "true" : undefined}
          onClick={this.handleClick}
          class={this.componentClassName}
          aria-describedby={this.ariaDescribedBy || undefined}
        >
          <div class="u:flex u:items-center u:justify-center">
            <slot name="icon">
              <span aria-hidden="true">
                <PasskeyIcon className={ICON_CLASSNAME} />
              </span>
            </slot>
            <span class="u:ml-4">{authState.loading ? loadingText : text}</span>
          </div>
        </button>
        {this.continueWithPasskey && registrationState.rid && authState.globalErrors.auth === "registration_flow_already_exists" && (
          <button
            type="button"
            class={this.componentClassName}
            disabled={isDisabled}
            onClick={() => this.continueWithEmail(true)}
            aria-describedby={this.ariaDescribedBy || undefined}
          >
            {t("auth.passkey.start_new_registration", { defaultValue: "Start a new registration" })}
          </button>
        )}
      </Host>
    );
  }
}
