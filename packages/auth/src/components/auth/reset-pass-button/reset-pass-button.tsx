import { Component, h, Prop } from "@stencil/core";
import { Auth } from "../../../auth";
import { authState } from "../../../store/auth-store";

@Component({
  tag: "reset-password-button",
  shadow: false,
})
export class ResetPasswordButton {
  @Prop() className = "";
  @Prop() text = "Reset Password";
  @Prop() successMessage = "Password reset email sent. Please check your inbox.";

  private handleClick = async () => {
    const authInstance = await Auth.getInstance();

    if (!authInstance) {
      console.error("Auth service not initialized");
      return;
    }

    await authInstance.helpers.sendResetPasswordEmail();
  };

  render() {
    if (authState.step !== "verification") {
      return null;
    }

    return (
      <div>
        <button type="button" onClick={this.handleClick} class={this.className}>
          {this.text}
        </button>
        {authState.resetPasswordSent && <flash-message variant="success" message={this.successMessage} />}
      </div>
    );
  }
}
