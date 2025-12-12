import { Component, h, Prop, Host } from "@stencil/core";
<<<<<<< HEAD
import { authState, type AuthState } from "../../store/auth-store";

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
=======
import { authState } from "../../store/auth-store";
>>>>>>> 9f26f62 (Revert "Merge branch 'master' into ud-2047-sdk-support-for-single-step-login")

@Component({
  tag: "u-conditional-render",
  shadow: true,
})
export class ConditionalRender {
  @Prop() when!: string;
  @Prop() is!: "true" | "false";

<<<<<<< HEAD
  private evaluatePredefinedState(): unknown {
    const predefinedFunction = PREDEFINED_STATES[this.when];
    if (predefinedFunction) return predefinedFunction(authState);

    throw new Error(`[u-conditional-render] 'when' prop "${this.when}" is not a valid predefined state`);
  }

  private shouldRender(): boolean {
    if (!this.when && !this.conditionFunction) {
      console.error("[u-conditional-render] Either 'when' or 'conditionFunction' prop is required");
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
=======
  componentDidLoad() {
    // TODO: validate 'when' and 'is' and return error if 'expression' is invalid
  }

  private shouldRender(): boolean {
    if (!this.when) return false;

    const compareValue = this.is === "true";

    let actualValue: boolean;

    switch (this.when) {
      case "magicCodeSent":
        actualValue = authState.magicCodeStep === "sent" || authState.magicCodeStep === "requested";
        break;
      case "loading":
        actualValue = authState.loading;
        break;
      case "authenticated":
        actualValue = authState.authenticated;
        break;
      default:
        console.warn(`Unknown property: ${this.when}`);

        // don't render in case of invalid property
        return false;
    }

    return actualValue === compareValue;
>>>>>>> 9f26f62 (Revert "Merge branch 'master' into ud-2047-sdk-support-for-single-step-login")
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
