import { Component, Event, type EventEmitter, Host, h, Prop, State } from "@stencil/core";
import { Registration } from "../../registration";
import { registrationState } from "../../store/registration-store";

const DEFAULT_RESEND_COOLDOWN = 60;

@Component({
  tag: "u-registration-resume",
  styleUrl: "registration-resume.css",
  shadow: false,
})
export class RegistrationResume {
  /** CSS classes to apply to the button element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  /** Fired when the resume link email has been sent successfully. */
  @Event() resumeSent!: EventEmitter<void>;

  /** Fired when sending the resume link fails. Contains the error identifier. */
  @Event() resumeError!: EventEmitter<{ error: string }>;

  @State() countdown = 0;

  private registrationInstance: Registration | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  async componentWillLoad() {
    this.registrationInstance = await Registration.getInstance();
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
      const success = await helpers.sendResumeLink();
      if (success) {
        this.startCountdown(DEFAULT_RESEND_COOLDOWN);
        this.resumeSent.emit();
      } else {
        this.resumeError.emit({ error: registrationState.globalErrors.registration || "Failed to send resume link" });
      }
    }
  };

  render() {
    if (!registrationState.emailAlreadyInFlow) {
      return <Host hidden />;
    }

    if (registrationState.resumeEmailSent) {
      const canResend = this.countdown <= 0 && !registrationState.loading;

      return (
        <Host>
          <slot name="success" />
          <button
            type="button"
            class={this.componentClassName}
            onClick={this.handleClick}
            disabled={!canResend}
            aria-live="polite"
            aria-busy={registrationState.loading ? "true" : "false"}
            data-countdown={this.countdown > 0 ? this.countdown : undefined}
          >
            <slot name="resend" />
          </button>
        </Host>
      );
    }

    return (
      <Host>
        <button
          type="button"
          class={this.componentClassName}
          onClick={this.handleClick}
          disabled={registrationState.loading}
          aria-live="polite"
          aria-busy={registrationState.loading ? "true" : "false"}
        >
          <slot />
        </button>
      </Host>
    );
  }
}
