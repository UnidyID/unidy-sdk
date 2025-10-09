import { Component, h, Prop } from "@stencil/core";
import { Auth } from "../../../auth";
import { authState } from "../../../store/auth-store";

@Component({
  tag: "reset-pass-button",
  shadow: false,
})
export class ResetPassButton {
  @Prop() className = "";
  @Prop() text = "Reset Password";

  private handleClick = async () => {
    const authService = await Auth.getInstance();

    if (!authService) {
      console.error("Auth service not initialized");
      return;
    }

    await authService.sendResetPasswordEmail();
  };

  render() {
    if (authState.step !== "verification") {
      return null;
    }

    return (
      <button type="button" onClick={this.handleClick} class={this.className}>
        {this.text}
      </button>
    );
  }
}
