import { Component, h, Prop, Element } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { getParentSigninStep } from "../helpers";

@Component({
  tag: "u-auth-submit-button",
  shadow: false,
})
export class AuthSubmitButton {
  @Element() el!: HTMLElement;

  @Prop() for?: "email" | "password";
  @Prop() text = "";
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private getButtonText() {
    if (this.text) return this.text;

    switch (authState.step) {
      case "email":
        return "Continue";
      case "verification":
        return "Sign In";
      case "single-login":
        return "Sign In";
      default:
        return "Continue";
    }
  }

  private shouldRender(): boolean {
    if (!authState.availableLoginOptions?.password && this.for === "password") {
      return false;
    }

    if (authState.step === "email") {
      return this.for === "email";
    }

    if (authState.step === "verification") {
      return this.for === "password" && authState.magicCodeStep !== "sent";
    }

    if (authState.step === "single-login") {
      return true;
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

    if (authState.step === "single-login") {
      return authState.password === "" || authState.email === "";
    }

    return false;
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    (await getParentSigninStep(this.el))?.submit();
  };

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    return (
      <button type="submit" disabled={this.isDisabled()} class={this.componentClassName} onClick={this.handleClick} aria-live="polite">
        {authState.loading && authState.magicCodeStep !== "requested" ? (
          <div>
            <u-spinner /> Loading...
          </div>
        ) : (
          this.getButtonText()
        )}
      </button>
    );
  }
}
