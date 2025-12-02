import { Component, h, Prop } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { AUTH_ERROR_MESSAGES } from "../../error-definitions";
import { unidyState } from "../../../shared/store/unidy-store";

@Component({
  tag: "u-error-message",
  shadow: false,
})
export class ErrorMessage {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() for!: "email" | "password" | "magicCode" | "general" | "connection";

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
    let errorCode: string | null = null;

    if (this.for === "connection") {
      errorCode = unidyState.backendConnected ? null : "connection_failed";
    } else if (this.for === "general") {
      errorCode = authState.globalErrors.auth;
    } else {
      errorCode = authState.errors[this.for];
    }

    if (!errorCode) {
      return null;
    }

    return <div class={this.componentClassName}>{this.getErrorMessage(errorCode)}</div>;
  }
}
