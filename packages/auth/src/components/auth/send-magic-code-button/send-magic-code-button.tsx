import { Component, h, Prop, State } from "@stencil/core";
import { authState, authStore } from "../../../store/auth-store";
import { Auth } from "../../../auth.js";

@Component({
  tag: "send-magic-code-button",
  shadow: false,
})
export class SendMagicCodeButton {
  @Prop() disabled = false;
  @Prop() customStyle = "";
  @Prop() text = "Send Magic Code";
  @Prop() alreadySentText = "Magic code already sent to your email";

  @State() countdown = 0;
  private countdownInterval: number | null = null;

  componentWillLoad() {
    if (authState.enableResendMagicCodeAfter) {
      this.startCountdown();
    }
  }

  private handleClick = async () => {
    if (this.disabled || authState.loading || this.countdown > 0) return;

    const authService = await Auth.getInstance();

    if (!authService) {
      console.error("Auth service not initialized");
      return;
    }

    await authService.sendMagicCode();

    this.startCountdown();
  };

  private startCountdown = () => {
    if (authState.enableResendMagicCodeAfter) {
      this.countdown = Math.ceil(authState.enableResendMagicCodeAfter / 1000);

      this.countdownInterval = window.setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          this.clearCountdown();
          authStore.setEnableResendMagicCodeAfter(null);
          authStore.clearFieldError("magicCode");
        }
      }, 1000);
    }
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

    const isDisabled = this.disabled || authState.magicCodeRequested || this.countdown > 0;

    return (
      <button type="button" disabled={isDisabled} onClick={this.handleClick} class={this.customStyle} style={{ width: "100%" }}>
        {this.countdown > 0 ? this.alreadySentText : authState.loading && authState.magicCodeRequested ? "Sending..." : this.text}
      </button>
    );
  }
}
