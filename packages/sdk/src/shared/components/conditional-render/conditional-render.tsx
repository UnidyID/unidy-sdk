import { Component, h, Prop, Host } from "@stencil/core";
import { authState, type AuthState } from "../../../auth/store/auth-store";
import { newsletterStore } from "../../../newsletter/store/newsletter-store";
import { profileStore } from "../../../profile/store/profile-store";
import * as NewsletterHelpers from "../../../newsletter/newsletter-helpers";

const PREDEFINED_CONDITIONS: Record<string, (...args: unknown[]) => unknown> = {
  "auth.passkeyEnabled": () => authState.availableLoginOptions?.passkey,
  "auth.passwordEnabled": () => authState.availableLoginOptions?.password,
  "auth.magicCodeEnabled": () => authState.availableLoginOptions?.magic_link,
  "auth.socialLoginsEnabled": () => (authState.availableLoginOptions?.social_logins?.length ?? 0) > 0,
  "auth.loading": () => authState.loading,
  "auth.authenticated": () => authState.authenticated,
  "auth.magicCodeSent": () => authState.magicCodeStep === "sent" || authState.magicCodeStep === "requested",
  "auth.magicCodeRequested": () => authState.magicCodeStep === "requested",
  "auth.resetPasswordSent": () => authState.resetPassword.step === "sent" || authState.resetPassword.step === "requested",
  "auth.resetPasswordRequested": () => authState.resetPassword.step === "requested",

  "newsletter.hasCheckedNewsletters": () => newsletterStore.state.checkedNewsletters.length > 0,
  "newsletter.hasPreferenceToken": () => !!newsletterStore.state.preferenceToken,
  "newsletter.subscribed": (newsletterInternalName: string) => NewsletterHelpers.isSubscribed(newsletterInternalName),
  "newsletter.confirmed": (newsletterInternalName: string) => NewsletterHelpers.isConfirmed(newsletterInternalName),
  "newsletter.loggedIn": () => newsletterStore.state.isAuthenticated || newsletterStore.state.preferenceToken !== "",

  "profile.loading": () => profileStore.state.loading,
  "profile.hasErrors": () => Object.keys(profileStore.state.errors).some((key) => profileStore.state.errors[key] !== null),
  "profile.hasFlashErrors": () => Object.keys(profileStore.state.flashErrors).some((key) => profileStore.state.flashErrors[key] !== null),
  "profile.phoneValid": () => profileStore.state.phoneValid,
  "profile.hasData": () => Object.keys(profileStore.state.data).length > 0,
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

  private evaluateCondition(): unknown {
    const predefinedFunction = PREDEFINED_CONDITIONS[this.when];
    if (predefinedFunction) {
      return predefinedFunction(this.is);
    }

    return null;
  }

  private shouldRender(): boolean {
    if (!this.when && !this.conditionFunction) {
      console.error("[u-conditional-render] Either 'when' or 'conditionFunction' prop is required");
    }

    if (this.conditionFunction) {
      const result = this.conditionFunction(authState);
      return this.not ? !result : result;
    }

    const value = this.evaluateCondition();
    if (value === null) {
      return false;
    }

    const normalizedIs = this.is?.toString().toLowerCase();
    let result: boolean;

    if (typeof value === "boolean") {
      if (normalizedIs === "false" || normalizedIs === "disabled") {
        result = !value;
      } else {
        result = value;
      }
    } else if (this.is === undefined) {
      result = isTruthy(value);
    } else if (normalizedIs === "enabled" || normalizedIs === "true") {
      result = isTruthy(value);
    } else if (normalizedIs === "disabled" || normalizedIs === "false") {
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
