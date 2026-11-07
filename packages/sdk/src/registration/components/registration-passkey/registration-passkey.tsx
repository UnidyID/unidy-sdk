import { Component, Element, Host, h, Method, Prop, State, Watch } from "@stencil/core";
import { authState, onChange as onAuthChange } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { isWebAuthnSupported } from "../../../shared/passkey-utils";
import { Registration } from "../../registration";
import { onChange, registrationState } from "../../store/registration-store";
import { getParentRegistrationStep } from "../helpers";

@Component({ tag: "u-registration-passkey", styleUrl: "registration-passkey.css", shadow: false })
export class RegistrationPasskey {
  @Element() element!: HTMLElement;
  /** CSS classes to apply to the passkey button element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";
  /** Optional name for the passkey (defaults to "Passkey"). */
  @Prop({ attribute: "passkey-name" }) passkeyName?: string;
  /** Disable the button and cancel any outstanding creation. */
  @Prop() disabled = false;
  /** Set false when hiding or closing registration to cancel and ignore pending creation results. */
  @Prop() active = true;
  /** Automatically try creation once per new flow with typed-email passkey intent, when this step becomes active. */
  @Prop() autoStart = false;
  /** Offer an explicit password path through the remaining configured registration steps. */
  @Prop() passwordFallback = false;
  /** Tailwind classes for the optional password fallback button. */
  @Prop({ attribute: "fallback-class-name" }) fallbackClassName = "";

  @State() private isSupported = false;
  @State() private renderTrigger = 0;
  private registrationInstance: Registration | null = null;
  private unsubscribers: (() => void)[] = [];
  private attemptedRid?: string;
  private focusAfterCreation?: "continue" | "password";
  private mayMoveFocus = false;
  private releaseFocusWatch?: () => void;

  async componentWillLoad() {
    this.isSupported = isWebAuthnSupported();
    this.registrationInstance = await Registration.getInstance();
    this.scheduleAutoStart();
  }

  connectedCallback() {
    const update = () => {
      this.renderTrigger++;
      this.scheduleAutoStart();
    };
    for (const prop of ["hasPasskey", "loading", "rid", "currentStepName", "passkeyIntent"] as const) {
      this.unsubscribers.push(onChange(prop, update));
    }
    this.unsubscribers.push(onAuthChange("step", update));
  }

  disconnectedCallback() {
    this.mayMoveFocus = false;
    this.focusAfterCreation = undefined;
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.releaseFocusWatch?.();
    void this.registrationInstance?.helpers.cancelPasskeyRegistration();
  }

  @Watch("active")
  @Watch("disabled")
  @Watch("autoStart")
  lifecycleChanged() {
    if (!this.active || this.disabled) {
      this.mayMoveFocus = false;
      this.releaseFocusWatch?.();
      void this.registrationInstance?.helpers.cancelPasskeyRegistration();
    } else this.scheduleAutoStart();
  }

  private isActiveStep() {
    const signinStep = this.element.closest("u-signin-step");
    return (
      this.element.isConnected &&
      this.active &&
      !this.disabled &&
      (!signinStep || signinStep.name === authState.step) &&
      getParentRegistrationStep(this.element)?.name === registrationState.currentStepName
    );
  }

  private scheduleAutoStart() {
    queueMicrotask(() => {
      if (
        !this.registrationInstance ||
        !this.autoStart ||
        !this.isSupported ||
        !this.isActiveStep() ||
        !registrationState.passkeyIntent ||
        !registrationState.rid ||
        registrationState.loading ||
        registrationState.submitting ||
        registrationState.hasPasskey ||
        this.attemptedRid === registrationState.rid
      )
        return;
      this.attemptedRid = registrationState.rid;
      this.releaseFocusWatch?.();
      this.mayMoveFocus = true;
      // A hidden initiating button can make native dialogs focus their first control (Safari).
      // Reserve the next focus unless the user moves it with another page interaction while waiting.
      const preserveUserFocus = () => {
        this.mayMoveFocus = false;
      };
      document.addEventListener("keydown", preserveUserFocus, true);
      document.addEventListener("pointerdown", preserveUserFocus, true);
      this.releaseFocusWatch = () => {
        document.removeEventListener("keydown", preserveUserFocus, true);
        document.removeEventListener("pointerdown", preserveUserFocus, true);
        this.releaseFocusWatch = undefined;
      };
      void this.registrationInstance.helpers.registerPasskey(this.passkeyName).then((success) => {
        if (!this.isActiveStep()) {
          this.releaseFocusWatch?.();
          return;
        }
        this.focusAfterCreation = success ? "continue" : "password";
        this.renderTrigger++;
      });
    });
  }

  componentDidRender() {
    const focus = this.focusAfterCreation;
    this.focusAfterCreation = undefined;
    if (!focus) return;
    const focusWatch = this.releaseFocusWatch;
    const rid = registrationState.rid;
    // Ancestor steps can still be rendering their hidden state in this frame (notably in WebKit).
    requestAnimationFrame(() => {
      if (this.releaseFocusWatch === focusWatch) this.releaseFocusWatch?.();
      if (!this.mayMoveFocus || !this.isActiveStep() || registrationState.rid !== rid) return;
      const target =
        focus === "continue"
          ? getParentRegistrationStep(this.element)?.querySelector<HTMLButtonElement>("u-submit-button button")
          : (this.element.querySelector<HTMLButtonElement>('[part="password-fallback-button"]') ??
            this.element.querySelector<HTMLButtonElement>("button:not([hidden])"));
      target?.focus();
    });
  }

  /** Cancel creation, choose password, and submit this step using the normal ordered onboarding flow. */
  @Method()
  async continueWithPassword(): Promise<void> {
    const helpers = this.registrationInstance?.helpers;
    if (!helpers) return;
    await helpers.cancelPasskeyRegistration();
    if (!this.isActiveStep()) return;
    helpers.continueWithPassword();
    await getParentRegistrationStep(this.element)?.submit();
  }

  private handleClick = async () => {
    if (this.disabled || !this.active || registrationState.loading) return;
    if (registrationState.hasPasskey) await this.registrationInstance?.helpers.removePasskey();
    else await this.registrationInstance?.helpers.registerPasskey(this.passkeyName);
  };

  render() {
    void this.renderTrigger;
    const isDisabled = this.disabled || !this.active || registrationState.loading;
    return (
      <Host>
        <button
          hidden={!this.isSupported}
          type="button"
          disabled={isDisabled || !this.isSupported}
          onClick={this.handleClick}
          class={this.componentClassName}
          aria-live="polite"
        >
          <slot />
          {registrationState.hasPasskey && (
            <span role="img" aria-label="Passkey registered">
              {" "}
              &#x2713;
            </span>
          )}
        </button>
        {this.passwordFallback && !registrationState.hasPasskey && (
          <button
            type="button"
            disabled={isDisabled}
            part="password-fallback-button"
            class={this.fallbackClassName}
            onClick={() => this.continueWithPassword()}
          >
            {t("auth.passkey.continue_with_password", { defaultValue: "Continue with password" })}
          </button>
        )}
      </Host>
    );
  }
}
