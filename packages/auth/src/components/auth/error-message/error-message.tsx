import { Component, h, Prop } from "@stencil/core";
import { authState } from "../../../store/auth-store";
import { AUTH_ERROR_MESSAGES } from "../../../error-definitions";

@Component({
  tag: "u-error-message",
  shadow: false,
})
export class ErrorMessage {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() for!: "email" | "password" | "magicCode" | "general";

  // User defined messages(translations) per error code --> TODO: maybe this should be part of config component ?
  @Prop() errorMessages?: Record<string, string>;

  private getErrorMessage(errorCode: string): string {
    if (this.errorMessages?.[errorCode]) {
      return this.errorMessages[errorCode];
    }

    if (AUTH_ERROR_MESSAGES[errorCode]) {
      return AUTH_ERROR_MESSAGES[errorCode];
    }

    return errorCode || "An error occurred";
  }

  render() {
    const errorCode = this.for === "general" ? authState.globalErrors.auth : authState.errors[this.for];

    if (!errorCode) {
      return null;
    }

    return <div class={this.componentClassName}>{this.getErrorMessage(errorCode)}</div>;
  }
}
