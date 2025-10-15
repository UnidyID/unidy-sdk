import { Component, h, Prop, Element } from "@stencil/core";
import { authState } from "../../../store/auth-store";
import { Auth } from "../../../auth";

@Component({
  tag: "submit-button",
  shadow: false,
})
export class SubmitButton {
  @Element() el!: HTMLElement;

  @Prop() for!: "email" | "password";
  @Prop() text = "";
  @Prop() disabled = false;
  @Prop() customStyle = "";

  private handleClick = async () => {
    if (this.disabled || authState.loading) return;

    const authService = await Auth.getInstance();
    if (!authService) {
      console.error("Auth service not initialized");
      return;
    }

    if (authState.step === "email") {
      authService.createSignIn(authState.email);
    } else if (authState.step === "verification" && this.for === "password") {
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
    if (authState.step === "email") {
      return this.for === "email";
    }

    if (authState.step === "verification") {
      return this.for === "password" && !authState.magicCodeSent;
    }

    return false;
  }

  private isDisabled(): boolean {
    if (this.disabled || authState.loading) return true;

    if (authState.step === "email" && this.for === "email") {
      return authState.email === "";
    }

    if (authState.step === "verification" && this.for === "password") {
      return authState.password === "";
    }

    return false;
  }

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    return (
      <button type="button" disabled={this.isDisabled()} onClick={this.handleClick} class={this.customStyle} style={{ width: "100%" }}>
        {authState.loading && !authState.magicCodeRequested ? "Loading..." : this.getButtonText()}
      </button>
    );
  }
}
