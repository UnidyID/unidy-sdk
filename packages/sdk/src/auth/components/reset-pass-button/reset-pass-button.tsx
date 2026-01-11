import { Component, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { Flash } from "../../../shared/store/flash-store";
import { Auth } from "../../auth";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-reset-password-button",
  shadow: false,
})
export class ResetPasswordButton {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private handleClick = async () => {
    const authInstance = await Auth.getInstance();

    await authInstance.helpers.sendResetPasswordEmail();

    if (authState.resetPassword.step === "sent") {
      const successMessage = t("auth.resetPassword.success_message", {
        defaultValue: "Password reset email sent. Please check your inbox.",
      });

      Flash.success.addMessage(successMessage);
    }
  };

  private shouldRender(): boolean {
    if (["verification", "reset-password"].includes(authState.step)) return true;

    if (authState.step === "single-login" && authState.sid !== null) return true;

    return false;
  }

  private getButtonText() {
    if (
      ["verification", "single-login"].includes(authState.step) &&
      authState.availableLoginOptions &&
      !authState.availableLoginOptions.password
    ) {
      return t("auth.resetPassword.button_text_set", { defaultValue: "Set Password" });
    }

    if (authState.step === "reset-password") {
      return t("auth.resetPassword.button_text_resend", { defaultValue: "Resend Password Reset Email" });
    }

    return t("auth.resetPassword.button_text_reset", { defaultValue: "Reset Password" });
  }
  render() {
    if (!this.shouldRender()) {
      return null;
    }

    return (
      <button type="button" onClick={this.handleClick} class={this.componentClassName}>
        {this.getButtonText()}
      </button>
    );
  }
}
