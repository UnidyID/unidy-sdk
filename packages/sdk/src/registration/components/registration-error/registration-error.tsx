import { Component, Host, h, Prop } from "@stencil/core";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotContent } from "../../../shared/base/has-slot-content";
import { unidyState } from "../../../shared/store/unidy-store";
import { registrationState } from "../../store/registration-store";

const ERROR_MESSAGES: Record<string, string> = {
  email_already_registered: "This email is already registered. Please sign in instead.",
  registration_flow_already_exists: "A registration is already in progress for this email.",
  registration_not_found: "Registration session not found. Please start again.",
  registration_expired: "Registration session expired. Please start again.",
  cannot_finalize: "Cannot complete registration. Please fill in all required fields.",
  auth_method_required: "Please set a password or verify your email to continue.",
  email_required: "Email address is required.",
  field_required: "This field is required.",
  verification_code_recently_sent: "A verification code was recently sent. Please wait before requesting a new one.",
  invalid_code: "Invalid verification code. Please try again.",
  code_expired: "Verification code has expired. Please request a new one.",
  connection_failed: "Unable to connect to the server. Please check your connection.",
};

type ErrorField = "email" | "password" | "verificationCode" | "registration" | "connection" | string;

@Component({
  tag: "u-registration-error",
  styleUrl: "registration-error.css",
  shadow: false,
})
export class RegistrationError extends UnidyComponent(HasSlotContent) {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() for!: ErrorField;
  @Prop() errorMessages?: Record<string, string>;

  private getErrorMessage(errorCode: string): string {
    if (this.errorMessages?.[errorCode]) {
      return this.errorMessages[errorCode];
    }

    if (ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode];
    }

    return errorCode || "An error occurred";
  }

  render() {
    let errorCode: string | null = null;

    if (this.for === "connection") {
      errorCode = unidyState.backendConnected ? null : "connection_failed";
    } else if (this.for === "registration") {
      errorCode = registrationState.globalErrors.registration;
    } else {
      errorCode = registrationState.errors[this.for];
    }

    if (!errorCode) {
      return null;
    }

    if (errorCode === "connection_failed" && this.for !== "registration" && this.for !== "connection") {
      return null;
    }

    return <Host class={this.componentClassName}>{this.hasSlot ? <slot /> : this.getErrorMessage(errorCode)}</Host>;
  }
}
