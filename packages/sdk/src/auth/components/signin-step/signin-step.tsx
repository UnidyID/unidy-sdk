import { Component, Host, h, Prop, Method, Element } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../..";
import type { Submittable } from "../../../shared/interfaces/submittable";

export type AuthButtonFor = "email" | "password" | "resetPassword";

@Component({
  tag: "u-signin-step",
  shadow: true,
})
export class SigninStep implements Submittable {
  @Element() el!: HTMLElement;
  @Prop() name!: "email" | "verification" | "reset-password" | "registration";
  @Prop() alwaysRender = false;

  @Method()
  async isActive(): Promise<boolean> {
    return authState.step === this.name || this.alwaysRender;
  }

  @Method()
  async submit() {
    if (authState.loading) return;

    const authInstance = await Auth.getInstance();

    if (authState.step === "email") {
      await authInstance.helpers.createSignIn(authState.email);
    } else if (authState.step === "verification") {
      await authInstance.helpers.authenticateWithPassword(authState.password);
    } else if (authState.step === "reset-password") {
      await authInstance.helpers.resetPassword();
    }
  }

  @Method()
  async isSubmitDisabled(forProp?: AuthButtonFor): Promise<boolean> {
    if (authState.loading) return true;

    if (authState.step === "email" && forProp === "email") {
      return authState.email === "";
    }

    if (authState.step === "verification" && forProp === "password") {
      return authState.password === "";
    }

    if (authState.step === "reset-password" && forProp === "resetPassword") {
      return !authState.resetPassword.newPassword || !authState.resetPassword.passwordConfirmation;
    }

    return false;
  }

  @Method()
  async isLoading(): Promise<boolean> {
    return authState.loading;
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
