import { Component, h, Prop, State } from "@stencil/core";
import { Auth } from "../../auth";
import { authState, onChange } from "../../store/auth-store";

@Component({
  tag: "u-resend-invitation-email",
  styleUrl: "resend-invitation-email.css",
  shadow: false,
})
export class ResendInvitationEmail {
  /** CSS classes to apply to the button element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() countdown = 0;

  private authInstance: Auth | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private unsubscribers: (() => void)[] = [];

  async componentWillLoad() {
    this.authInstance = await Auth.getInstance();

    if (authState.enableResendAfter > 0) {
      this.startCountdown(authState.enableResendAfter);
    }

    this.unsubscribers.push(
      onChange("enableResendAfter", (value) => {
        if (value > 0) {
          this.startCountdown(value);
        }
      }),
    );
  }

  disconnectedCallback() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
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
    if (this.countdown > 0 || authState.loading) return;

    const helpers = this.authInstance?.helpers;
    if (helpers) {
      await helpers.resendInvitationEmail();
    }
  };

  render() {
    const canResend = this.countdown <= 0 && !authState.loading;

    return (
      <button
        type="button"
        class={this.componentClassName}
        onClick={this.handleClick}
        disabled={!canResend}
        aria-live="polite"
        aria-busy={authState.loading ? "true" : "false"}
        data-countdown={this.countdown > 0 ? this.countdown : undefined}
      >
        <slot />
      </button>
    );
  }
}
