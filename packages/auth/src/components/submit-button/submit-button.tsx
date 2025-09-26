import { Component, h, Prop, Element } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../../auth.js";

@Component({
  tag: "submit-button",
  shadow: false,
})
export class SubmitButton {
  @Element() el!: HTMLElement;

  @Prop() disabled = false;
  @Prop() className = "";
  @Prop() text = "";

  private getParentStepComponent(): HTMLSigninStepElement | null {
    return this.el.closest("signin-step") as HTMLSigninStepElement;
  }

  private handleClick = async () => {
    if (this.disabled || authState.loading) return;

    const authService = await Auth.getInstance();
    if (!authService) {
      console.error("Auth service not initialized");
      return;
    }

    if (authState.step === "email") {
      authService.createSignIn(authState.email);
    } else if (authState.step === "verification" && this.isPasswordStrategy()) {
      await authService.authenticateWithPassword(authState.password);
    }
  };

  private getButtonText() {
    if (this.text) return this.text;

    switch (authState.step) {
      case "email":
        return "Continue";
      case "verification":
        return "Sign In";
      default:
        return "Continue";
    }
  }

  private shouldRender(): boolean {
    const parentStepComponent = this.getParentStepComponent();
    if (parentStepComponent && authState.step !== parentStepComponent.name) {
      return false;
    }

    if (authState.step === "email") {
      return true;
    }

    if (authState.step === "verification") {
      return this.isPasswordStrategy() && !authState.magicCodeSent;
    }

    return false;
  }

  private isPasswordStrategy(): boolean {
    const parentStrategy = this.el.closest("signin-strategy") as HTMLSigninStrategyElement;
    return parentStrategy?.type === "password";
  }

  private isDisabled(): boolean {
    if (this.disabled || authState.loading) return true;

    if (authState.step === "email") {
      return authState.email === "";
    }

    if (authState.step === "verification" && this.isPasswordStrategy()) {
      return authState.password === "";
    }

    return false;
  }

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    return (
      <button type="button" disabled={this.isDisabled()} onClick={this.handleClick} class={this.className} style={{ width: "100%" }}>
        {authState.loading ? "Loading..." : this.getButtonText()}
      </button>
    );
  }
}
