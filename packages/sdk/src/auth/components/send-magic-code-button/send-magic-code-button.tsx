import { Component, h, Prop, render, State } from "@stencil/core";
import { t } from "../../../i18n";
import { Auth } from "../../auth";
import { authState, authStore } from "../../store/auth-store";

@Component({
  tag: "u-send-magic-code-button",
  shadow: false,
})
export class SendMagicCodeButton {
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() countdown = 0;
  private countdownInterval: number | null = null;

  private handleClick = async () => {
    if (this.disabled || authState.loading || this.countdown > 0) return;

    const authInstance = await Auth.getInstance();

    const [_error, response] = await authInstance.helpers.sendMagicCode();

    if (response && "enable_resend_after" in response) {
      this.startCountdown(response.enable_resend_after);
    }
  };

  private startCountdown = (enableResendAfter: number) => {
    this.countdown = Math.ceil(enableResendAfter / 1000);

    this.countdownInterval = window.setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.clearCountdown();
        authStore.clearFieldError("magicCode");
      }
    }, 1000);
  };

  private clearCountdown = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.countdown = 0;
  };

  disconnectedCallback() {
    this.clearCountdown();
  }

  private shouldRender(): boolean {
    if (!["magic-code", "verification", "single-login"].includes(authState.step)) {
      return false;
    }

    if (!authState.availableLoginOptions?.magic_link && authState.step !== "single-login") {
      return false;
    }

    if (authState.step === "single-login" && authState.magicCodeStep === "sent") {
      return false;
    }

    return true;
  }

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    const isDisabled = this.disabled || authState.magicCodeStep === "requested" || this.countdown > 0 || authState.email === "";
    const buttonTextKey = authState.step !== "magic-code" ? "auth.magicCode.button_text" : "auth.magicCode.resend.button_text";
    const text = t(buttonTextKey, { defaultValue: "Send Magic Code" });
    const alreadySentText = t("auth.magicCode.already_sent_text", { defaultValue: "Magic code already sent to your email" });
    const sendingText = t("auth.magicCode.sending_text", { defaultValue: "Sending..." });

    return (
      <button type="button" disabled={isDisabled} onClick={this.handleClick} class={this.componentClassName} aria-live="polite">
        {this.countdown > 0 ? alreadySentText : authState.loading && authState.magicCodeStep === "requested" ? sendingText : text}
      </button>
    );
  }
}
