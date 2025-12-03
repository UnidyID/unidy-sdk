import { Component, h, Prop } from "@stencil/core";
import i18n from "../../../i18n";
import { Auth } from "../../auth";
import { authState } from "../../store/auth-store";
import { Flash } from "../../../shared/store/flash-store";

@Component({
  tag: "u-reset-password-button",
  shadow: false,
})
export class ResetPasswordButton {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private handleClick = async () => {
    const authInstance = await Auth.getInstance();

    await authInstance.helpers.sendResetPasswordEmail();

    if (authState.resetPasswordStep === "sent") {
      const successMessage = i18n.t('auth.resetPassword.successMessage', { defaultValue: 'Password reset email sent. Please check your inbox.' });
      Flash.success.addMessage(successMessage);
    }
  };

  render() {
    if (authState.step !== "verification") {
      return null;
    }

    if (authState.availableLoginOptions && !authState.availableLoginOptions.password) {
      return null;
    }

    const text = i18n.t('auth.resetPassword.buttonText', { defaultValue: 'Reset Password' });

    return (
      <button type="button" onClick={this.handleClick} class={this.componentClassName}>
        {text}
      </button>
    );
  }
}
