import { Component, Element, Host, h, Method, Prop } from "@stencil/core";
import { Auth } from "../..";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-signin-step",
  shadow: false,
})
export class SigninStep {
  @Element() el!: HTMLElement;
  /** The name of this step in the sign-in flow. */
  @Prop() name!: "email" | "verification" | "magic-code" | "reset-password" | "single-login" | "missing-fields" | "registration";
  /** If true, the step will always render regardless of the current authentication step. */
  @Prop() alwaysRender = false;

  @Method()
  async isActive(): Promise<boolean> {
    return authState.step === this.name || this.alwaysRender;
  }

  @Method()
  async submit() {
    if (authState.loading) return;

    const authInstance = await Auth.getInstance();

    if (authState.step === "email" || authState.step === "single-login") {
      await authInstance.helpers.createSignIn(authState.email, authState.password);
    } else if (authState.step === "verification") {
      await authInstance.helpers.authenticateWithPassword(authState.password);
    } else if (authState.step === "reset-password") {
      await authInstance.helpers.resetPassword();
    }
  }

  render() {
    let shouldShow = false;

    if (this.name === "email") {
      shouldShow = authState.step === "email";
    } else if (this.name === "verification") {
      shouldShow = authState.step === "verification";
    } else if (this.name === "magic-code") {
      shouldShow = authState.step === "magic-code";
    } else if (this.name === "reset-password") {
      shouldShow = authState.step === "reset-password";
    } else if (this.name === "registration") {
      shouldShow = authState.step === "registration" && authState.errors.email === "account_not_found";
    } else if (this.name === "single-login") {
      shouldShow = authState.step === "single-login";
    } else if (this.name === "missing-fields") {
      shouldShow = authState.step === "missing-fields";
    }

    return (
      <Host
        hidden={!shouldShow}
        style={{ display: shouldShow ? undefined : "none" }}
        aria-hidden={!shouldShow ? "true" : null}
        aria-live="polite"
      >
        <slot />
      </Host>
    );
  }
}
