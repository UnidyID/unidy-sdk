import { Component, Host, h, Prop, Method, Element } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../..";

@Component({
  tag: "u-signin-step",
  shadow: true,
})
export class SigninStep {
  @Element() el!: HTMLElement;
  @Prop() name!: "email" | "verification" | "reset-password" | "single-login" | "missing-fields" | "registration";
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
    let shouldRender = false;

    if (this.name === "email") {
      shouldRender = authState.step === "email";
    } else if (this.name === "verification") {
      shouldRender = authState.step === "verification" || authState.step === "magic-code";
    } else if (this.name === "reset-password") {
      shouldRender = authState.step === "reset-password";
    } else if (this.name === "registration") {
      shouldRender = authState.step === "registration" && authState.errors.email === "account_not_found";
    } else if (this.name === "single-login") {
      shouldRender = authState.step === "single-login";
    } else if (this.name === "missing-fields") {
      shouldRender = authState.step === "missing-fields";
    }

    if (!shouldRender) {
      return null;
    }

    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
