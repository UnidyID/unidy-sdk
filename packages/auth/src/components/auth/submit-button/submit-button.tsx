import { Component, h, Prop, Element } from "@stencil/core";
import { authState } from "../../../store/auth-store";

@Component({
  tag: "submit-button",
  shadow: false,
})
export class SubmitButton {
  @Element() el!: HTMLElement;

  @Prop() for!: "email" | "password";
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
      default:
        return "Continue";
    }
  }

  private shouldRender(): boolean {
    if (authState.step === "email") {
      return this.for === "email";
    }

    if (authState.step === "verification") {
      return this.for === "password" && authState.magicCodeStep !== "sent";
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
      <button type="submit" disabled={this.isDisabled()} class={this.componentClassName} style={{ width: "100%" }}>
        {authState.loading && authState.magicCodeStep !== "requested" ? "Loading..." : this.getButtonText()}
      </button>
    );
  }
}
