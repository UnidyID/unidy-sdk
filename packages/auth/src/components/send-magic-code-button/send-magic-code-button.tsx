import { Component, h, Prop } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../../auth.js";

@Component({
  tag: "send-magic-code-button",
  shadow: false,
})
export class SendMagicCodeButton {
  @Prop() disabled = false;
  @Prop() className = "";
  @Prop() text = "Send Magic Code";

  private handleClick = async () => {
    if (this.disabled || authState.loading || authState.magicCodeSent) return;

    const authService = await Auth.getInstance();

    if (!authService) {
      console.error("Auth service not initialized");
      return;
    }

    await authService.sendMagicCode();
  };

  render() {
    if (authState.step !== "verification" || authState.magicCodeSent) {
      return null;
    }

    return (
      <button
        type="button"
        disabled={this.disabled || authState.loading || authState.magicCodeSent}
        onClick={this.handleClick}
        class={this.className}
        style={{ width: "100%" }}
      >
        {authState.loading && !authState.magicCodeSent ? "Sending..." : this.text}
      </button>
    );
  }
}
