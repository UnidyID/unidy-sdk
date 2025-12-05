import { Component, Element, h, Host, Prop } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { AUTH_ERROR_MESSAGES, CONNECTION_FAILED_MESSAGE } from "../../error-definitions";
import { unidyState } from "../../../shared/store/unidy-store";
import { hasSlotContent } from "../../../shared/component-utils";

@Component({
  tag: "u-error-message",
  shadow: true,
})
export class ErrorMessage {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() for!: "email" | "password" | "magicCode" | "resetPassword" | "general" | "connection";

  // User defined messages(translations) per error code --> TODO: maybe this should be part of config component ?
  @Prop() errorMessages?: Record<string, string>;
  @Element() el!: HTMLElement;

  private getErrorMessage(errorCode: string): string {
    if (this.errorMessages?.[errorCode]) {
      return this.errorMessages[errorCode];
    }

    if (AUTH_ERROR_MESSAGES[errorCode]) {
      return AUTH_ERROR_MESSAGES[errorCode];
    }

    if (errorCode === "connection_failed") {
      return CONNECTION_FAILED_MESSAGE;
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

    // Only render connection_failed for "general" and "connection" types
    if (errorCode === "connection_failed" && this.for !== "general" && this.for !== "connection") {
      return null;
    }

    return <Host class={this.componentClassName}>{hasSlotContent(this.el) ? <slot /> : this.getErrorMessage(errorCode)}</Host>;
  }
}
