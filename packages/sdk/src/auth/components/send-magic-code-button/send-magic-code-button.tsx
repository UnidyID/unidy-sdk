import { Component, h, Prop, State } from "@stencil/core";
import { authState, authStore } from "../../store/auth-store";
import { Auth } from "../../auth.js";

@Component({
  tag: "u-send-magic-code-button",
  shadow: false,
})
export class SendMagicCodeButton {
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() text = "Send Magic Code";
  @Prop() alreadySentText = "Magic code already sent to your email";

  @State() countdown = 0;
  private countdownInterval: number | null = null;

  private handleClick = async () => {
    if (this.disabled || authState.loading || this.countdown > 0) return;

    const authInstance = await Auth.getInstance();

    if (!authInstance) {
      console.error("Auth service not initialized");
      return;
    }

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

  render() {
    if (authState.step !== "magic-code" && authState.step !== "verification") {
      return null;
    }

    const isDisabled = this.disabled || authState.magicCodeStep === "requested" || this.countdown > 0;

    return (
      <button type="button" disabled={isDisabled} onClick={this.handleClick} class={this.componentClassName}>
        {this.countdown > 0
          ? this.alreadySentText
          : authState.loading && authState.magicCodeStep === "requested"
            ? "Sending..."
            : this.text}
      </button>
    );
  }
}
