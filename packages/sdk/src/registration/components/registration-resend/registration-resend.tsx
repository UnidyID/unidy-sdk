import { Component, h, Prop, State } from "@stencil/core";
import { Registration } from "../../registration";
import { registrationState } from "../../store/registration-store";

@Component({
  tag: "u-registration-resend",
  styleUrl: "registration-resend.css",
  shadow: false,
})
export class RegistrationResend {
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() countdown = 0;

  private registrationInstance: Registration | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  async componentWillLoad() {
    this.registrationInstance = await Registration.getInstance();

    if (registrationState.enableResendAfter > 0) {
      this.startCountdown(registrationState.enableResendAfter);
    }
  }

  disconnectedCallback() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private startCountdown(seconds: number): void {
    this.countdown = seconds;

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
      }
    }, 1000);
  }

  private handleClick = async () => {
    if (this.countdown > 0 || registrationState.loading) return;

    const helpers = this.registrationInstance?.helpers;
    if (helpers) {
      const success = await helpers.sendEmailVerificationCode();
      if (success && registrationState.enableResendAfter > 0) {
        this.startCountdown(registrationState.enableResendAfter);
      }
    }
  };

  render() {
    const canResend = this.countdown <= 0 && !registrationState.loading;

    return (
      <button
        type="button"
        class={this.componentClassName}
        onClick={this.handleClick}
        disabled={!canResend}
        data-countdown={this.countdown > 0 ? this.countdown : undefined}
      >
        <slot />
      </button>
    );
  }
}
