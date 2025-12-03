import { Component, h, Prop } from "@stencil/core";
import { Auth } from "../../auth";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-reset-password-button",
  shadow: false,
})
export class ResetPasswordButton {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() text = "Reset Password";
  @Prop() successMessage = "Password reset email sent. Please check your inbox.";

  private handleClick = async () => {
    const authInstance = await Auth.getInstance();

    await authInstance.helpers.sendResetPasswordEmail();
  };

  render() {
    if (authState.step !== "verification") {
      return null;
    }

    return (
      <>
        <button type="button" onClick={this.handleClick} class={this.componentClassName}>
          {this.text}
        </button>
        {authState.resetPasswordStep === "sent" && <flash-message variant="success" message={this.successMessage}  aria-live="polite"/>}
      </>
    );
  }
}
