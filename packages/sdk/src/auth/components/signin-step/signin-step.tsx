import * as Sentry from "@sentry/node";
import { Component, Host, h, Prop, Method, Element } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../..";

@Component({
  tag: "u-signin-step",
  shadow: true,
})
export class SigninStep {
  @Element() el!: HTMLElement;
  @Prop() name!: "email" | "verification";
  @Prop() alwaysRender = false;

  @Method()
  async isActive(): Promise<boolean> {
    return authState.step === this.name || this.alwaysRender;
  }

  @Method()
  async submit() {
    if (authState.loading) return;

    const authInstance = await Auth.getInstance();
    if (!authInstance) {
      Sentry.logger.error("Auth service not initialized");
      return;
    }

    if (authState.step === "email") {
      await authInstance.helpers.createSignIn(authState.email);
    } else if (authState.step === "verification") {
      await authInstance.helpers.authenticateWithPassword(authState.password);
    }
  }

  render() {
    let shouldRender = false;

    if (this.name === "email") {
      shouldRender = authState.step === "email";
    } else if (this.name === "verification") {
      shouldRender = authState.step === "verification" || authState.step === "magic-code";
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
