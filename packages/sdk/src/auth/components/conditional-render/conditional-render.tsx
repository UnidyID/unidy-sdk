import { Component, h, Prop, Host } from "@stencil/core";
import { authState, type AuthState } from "../../store/auth-store";
import { newsletterStore } from "../../../newsletter/store/newsletter-store";
import { profileStore, type ProfileState } from "../../../profile/store/profile-store";

type NewsletterState = typeof newsletterStore.state;
type AnyStoreState = AuthState | NewsletterState | ProfileState;

interface PredefinedCondition {
  getState: () => AnyStoreState;
  evaluate: (state: AnyStoreState) => unknown;
}

const PREDEFINED_CONDITIONS: Record<string, PredefinedCondition> = {
  "auth.passkeyEnabled": { getState: () => authState, evaluate: (s) => (s as AuthState).availableLoginOptions?.passkey },
  "auth.passwordEnabled": { getState: () => authState, evaluate: (s) => (s as AuthState).availableLoginOptions?.password },
  "auth.magicCodeEnabled": { getState: () => authState, evaluate: (s) => (s as AuthState).availableLoginOptions?.magic_link },
  "auth.socialLoginsEnabled": { getState: () => authState, evaluate: (s) => ((s as AuthState).availableLoginOptions?.social_logins?.length ?? 0) > 0 },
  "auth.loading": { getState: () => authState, evaluate: (s) => (s as AuthState).loading },
  "auth.authenticated": { getState: () => authState, evaluate: (s) => (s as AuthState).authenticated },
  "auth.magicCodeSent": { getState: () => authState, evaluate: (s) => (s as AuthState).magicCodeStep === "sent" || (s as AuthState).magicCodeStep === "requested" },
  "auth.magicCodeRequested": { getState: () => authState, evaluate: (s) => (s as AuthState).magicCodeStep === "requested" },
  "auth.resetPasswordSent": { getState: () => authState, evaluate: (s) => (s as AuthState).resetPassword.step === "sent" || (s as AuthState).resetPassword.step === "requested" },
  "auth.resetPasswordRequested": { getState: () => authState, evaluate: (s) => (s as AuthState).resetPassword.step === "requested" },

  "newsletter.loading": { getState: () => newsletterStore.state, evaluate: (s) => (s as NewsletterState).loading },
  "newsletter.hasCheckedNewsletters": { getState: () => newsletterStore.state, evaluate: (s) => (s as NewsletterState).checkedNewsletters.length > 0 },
  "newsletter.hasPreferenceToken": { getState: () => newsletterStore.state, evaluate: (s) => !!(s as NewsletterState).preferenceToken },

  "profile.loading": { getState: () => profileStore.state, evaluate: (s) => (s as ProfileState).loading },
  "profile.hasErrors": { getState: () => profileStore.state, evaluate: (s) => Object.keys((s as ProfileState).errors).some((key) => (s as ProfileState).errors[key] !== null) },
  "profile.hasFlashErrors": { getState: () => profileStore.state, evaluate: (s) => Object.keys((s as ProfileState).flashErrors).some((key) => (s as ProfileState).flashErrors[key] !== null) },
  "profile.phoneValid": { getState: () => profileStore.state, evaluate: (s) => (s as ProfileState).phoneValid },
  "profile.hasData": { getState: () => profileStore.state, evaluate: (s) => Object.keys((s as ProfileState).data).length > 0 },
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

  private evaluateCondition(): unknown {
    const condition = PREDEFINED_CONDITIONS[this.when];
    if (condition) {
      return condition.evaluate(condition.getState());
    }

    const availableConditions = Object.keys(PREDEFINED_CONDITIONS).join(", ");
    throw new Error(`[u-conditional-render] 'when' prop "${this.when}" is not valid. Available: ${availableConditions}`);
  }

  private shouldRender(): boolean {
    if (!this.when) {
      console.error("[u-conditional-render] 'when' prop is required");
      return false;
    }

    const value = this.evaluateCondition();

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
