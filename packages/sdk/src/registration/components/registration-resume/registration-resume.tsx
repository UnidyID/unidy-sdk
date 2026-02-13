import { Component, h, Prop, Event, type EventEmitter } from "@stencil/core";
import { registrationState } from "../../store/registration-store";
import { Registration } from "../../registration";

@Component({
  tag: "u-registration-resume",
  styleUrl: "registration-resume.css",
  shadow: false,
})
export class RegistrationResume {
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @Event() resumeSent!: EventEmitter<void>;
  @Event() resumeError!: EventEmitter<{ error: string }>;

  private registrationInstance: Registration | null = null;

  async componentWillLoad() {
    this.registrationInstance = await Registration.getInstance();
  }

  private handleClick = async () => {
    if (registrationState.loading) return;

    const helpers = this.registrationInstance?.helpers;
    if (helpers) {
      const success = await helpers.sendResumeLink();
      if (success) {
        this.resumeSent.emit();
      } else {
        this.resumeError.emit({ error: registrationState.globalErrors.registration || "Failed to send resume link" });
      }
    }
  };

  render() {
    if (!registrationState.emailAlreadyInFlow) {
      return null;
    }

    return (
      <button
        type="button"
        class={this.componentClassName}
        onClick={this.handleClick}
        disabled={registrationState.loading || registrationState.resumeEmailSent}
      >
        <slot />
      </button>
    );
  }
}
