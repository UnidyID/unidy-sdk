import { Component, Element, h, Host, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { authState } from "../../store/auth-store";
import { unidyState } from "../../../shared/store/unidy-store";
import { NewsletterErrorIdentifier, newsletterStore } from "../../../newsletter/store/newsletter-store";
import { hasSlotContent } from "../../../shared/component-utils";

export type AuthErrorType = "email" | "password" | "magicCode" | "resetPassword" | "general" | "connection";

@Component({
  tag: "u-error-message",
  shadow: true,
})
export class ErrorMessage {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() for!: string;

  @Prop() errorMessages?: Record<string, string>;
  @Element() el!: HTMLElement;

  private detectContext(): "auth" | "newsletter" | "profile" {
    if (this.el.closest("u-signin-root") || this.el.closest("u-signin-step"))
      return "auth";

    if (this.el.closest("u-profile"))
      return "profile";

    if (this.el.closest("u-newsletter-root"))
      return "newsletter";

    throw new Error("No context found for error message. Make sure you are using the component within a u-signin-root, u-profile, or u-newsletter-root.");
  }

  private get context(): "auth" | "newsletter" | "profile" {
    return this.detectContext();
  }

  private getAuthErrorMessage(errorCode: string): string {
    if (this.errorMessages?.[errorCode]) {
      return this.errorMessages[errorCode];
    }

    const translatedError = t(`errors.${errorCode}`);
    if (translatedError !== `errors.${errorCode}`) {
      return translatedError;
    }

    return errorCode || t("errors.unknown", { defaultValue: "An error occurred" });
  }


  private getNewsletterErrorMessage(errorIdentifier: NewsletterErrorIdentifier): string {
    return t(`newsletter.errors.${errorIdentifier}`) || t("newsletter.errors.unknown");
  }

  private getErrorMessage(errorCode: string): string | null {
    if (this.context === "auth") {
      return this.getAuthErrorMessage(errorCode);
    }

    return this.getNewsletterErrorMessage(errorCode as NewsletterErrorIdentifier);
  }

  private getAuthErrorCode(): string | null {
    const forValue = this.for as AuthErrorType;

    if (forValue === "connection") {
      return unidyState.backendConnected ? null : "connection_failed";
    }

    if (forValue === "general") {
      return authState.globalErrors.auth;
    }

    return authState.errors[forValue];
  }

  private getNewsletterErrorCode(): string | null {
    const error = newsletterStore.state.errors[this.for];
    return error ?? null;
  }


  render() {
    const errorCode = this.context === "newsletter" ? this.getNewsletterErrorCode() : this.getAuthErrorCode();

    if (!errorCode) {
      return null;
    }

    // Only render connection_failed for "general" and "connection" types
    if (errorCode === "connection_failed" && this.for !== "general" && this.for !== "connection") {
      return null;
    }

    const errorMessage = this.getErrorMessage(errorCode);
    const formattedMessage = errorMessage?.includes("\n") ? <div style={{ whiteSpace: "pre-line" }}>{errorMessage}</div> : errorMessage;

    return <Host class={this.componentClassName}>{hasSlotContent(this.el) ? <slot /> : formattedMessage}</Host>;
  }
}
