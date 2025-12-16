import { Component, h, Prop, Host } from "@stencil/core";
import { authState, type AuthState } from "../../store/auth-store";
import { logger } from "../../../logger";

const PREDEFINED_STATES: Record<string, (state: AuthState) => unknown> = {
  // login options
  passkeyEnabled: (state) => state.availableLoginOptions?.passkey,
  passwordEnabled: (state) => state.availableLoginOptions?.password,
  magicCodeEnabled: (state) => state.availableLoginOptions?.magic_link,
  socialLoginsEnabled: (state) => (state.availableLoginOptions?.social_logins?.length ?? 0) > 0,

  loading: (state) => state.loading,
  authenticated: (state) => state.authenticated,

  magicCodeSent: (state) => state.magicCodeStep === "sent" || state.magicCodeStep === "requested",
  magicCodeRequested: (state) => state.magicCodeStep === "requested",

  resetPasswordSent: (state) => state.resetPassword.step === "sent" || state.resetPassword.step === "requested",
  resetPasswordRequested: (state) => state.resetPassword.step === "requested",
};

function isTruthy(value: unknown): boolean {
  return Boolean(value);
}

@Component({
  tag: "u-conditional-render",
  shadow: true,
})
export class ConditionalRender {
  @Prop() when?: string; // condition to check
  @Prop() is?: string; // optional value to compare against
  @Prop() not = false;
  @Prop() conditionFunction?: (state: AuthState) => boolean;

  private evaluatePredefinedState(): unknown {
    const predefinedFunction = PREDEFINED_STATES[this.when];
    if (predefinedFunction) return predefinedFunction(authState);

    throw new Error(`[u-conditional-render] 'when' prop "${this.when}" is not a valid predefined state`);
  }

  private shouldRender(): boolean {
    if (!this.when && !this.conditionFunction) {
      logger.error(`[${this.constructor.name}] Either 'when' or 'conditionFunction' prop is required`);
      return false;
    }

    if (this.conditionFunction) {
      const result = this.conditionFunction(authState);
      return this.not ? !result : result;
    }

    const value = this.evaluatePredefinedState();

    let result: boolean;

    if (this.is === undefined) {
      result = isTruthy(value);
    } else if (this.is === "enabled" || this.is === "true") {
      result = isTruthy(value);
    } else if (this.is === "disabled" || this.is === "false") {
      result = !isTruthy(value);
    } else {
      result = String(value) === String(this.is); // to compare exact value
    }

    return this.not ? !result : result;
  }

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    return (
      <Host aria-live="polite">
        <slot />
      </Host>
    );
  }
}
