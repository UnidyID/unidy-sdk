import { Component, h, Prop } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../../auth.js";

@Component({
  tag: "submit-button",
  shadow: false,
})
export class SubmitButton {
  @Prop() disabled = false;
  @Prop() className = "";

  private handleClick = async () => {
    if (this.disabled || authState.loading) return;

    const authService = await Auth.getInstance();
    if (!authService) {
      console.error("Auth service not initialized");
      return;
    }

    if (authState.step === "email") {
      authService.createSignIn(authState.email);
    } else if (authState.step === "verification") {
      await authService.authenticateWithPassword(authState.password);
    }
  };

  render() {
    const buttonText = authState.step === "email" ? "Continue" : "Sign In";

    return (
      <button
        type="button"
        disabled={this.disabled || authState.loading}
        onClick={this.handleClick}
        class={this.className}
        style={{ width: "100%" }}
      >
        {authState.loading ? "Loading..." : buttonText}
      </button>
    );
  }
}
