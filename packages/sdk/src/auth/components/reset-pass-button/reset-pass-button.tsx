import { Component, h, Prop } from "@stencil/core";
import { Auth } from "../../auth";
import { authState } from "../../store/auth-store";
import { Flash } from "../../../shared/store/flash-store";

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
    if (!authInstance) {
      console.error("Auth service not initialized");
      return;
    }

    await authInstance.helpers.sendResetPasswordEmail();

    if (authState.resetPasswordStep === "sent") {
      Flash.success = this.successMessage;
    }
  };

  render() {
    if (authState.step !== "verification") {
      return null;
    }

    return (
      <button type="button" onClick={this.handleClick} class={this.componentClassName}>
        {this.text}
      </button>
    );
  }
}
