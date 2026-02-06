import { Component, Host, h, Prop } from "@stencil/core";
import { authState } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { type NewsletterErrorIdentifier, newsletterStore } from "../../../newsletter/store/newsletter-store";
import { UnidyComponent } from "../../base/component";
import { HasSlotContent } from "../../base/has-slot-content";
import { type ComponentContext, detectContext } from "../../context-utils";
import { unidyState } from "../../store/unidy-store";

export type AuthErrorType = "email" | "password" | "magicCode" | "resetPassword" | "general" | "connection" | "passkey";

type ErrorMessageContext = ComponentContext | "other";

@Component({
  tag: "u-error-message",
  shadow: false,
  styleUrl: "error-message.css",
})
export class ErrorMessage extends UnidyComponent(HasSlotContent) {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() for!: string;

  @Prop() errorMessages?: Record<string, string>;

  private get context(): ErrorMessageContext {
    const detectedContext = detectContext(this.element);

    if (detectedContext) {
      return detectedContext;
    }

    // Allow "general" and "connection" error types outside of standard containers
    if (this.for === "general" || this.for === "connection") {
      return "other";
    }

    throw new Error(
      "No context found for error message. Make sure you are using the component within a u-signin-root, u-profile, or u-newsletter-root.",
    );
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
    const translationKey = `newsletter.errors.${errorIdentifier}`;
    const translated = t(translationKey);

    if (translated !== translationKey) {
      return translated;
    }
    return t("errors.unknown", { defaultValue: "An unknown error occurred" });
  }

  private getErrorMessage(errorCode: string): string | null {
    if (this.context === "auth") {
      return this.getAuthErrorMessage(errorCode);
    }

    const fieldError = newsletterStore.state.additionalFieldErrors[this.for];
    if (fieldError) {
      return this.translateValidationError(fieldError);
    }

    return this.getNewsletterErrorMessage(errorCode as NewsletterErrorIdentifier);
  }

  private translateValidationError(errorIdentifier: string): string {
    const fieldSpecificKey = `errors.${this.for}.${errorIdentifier}`;
    const fieldSpecific = t(fieldSpecificKey);
    if (fieldSpecific !== fieldSpecificKey) {
      return fieldSpecific;
    }

    const genericKey = `errors.validation.${errorIdentifier}`;
    const generic = t(genericKey);
    if (generic !== genericKey) {
      return generic;
    }

    return t("errors.unknown", { defaultValue: "An unknown error occurred" });
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
    const newsletterError = newsletterStore.state.errors[this.for];
    if (newsletterError) return newsletterError;

    const fieldError = newsletterStore.state.additionalFieldErrors[this.for];
    return fieldError ?? null;
  }

  render() {
    const errorCode = this.context === "newsletter" ? this.getNewsletterErrorCode() : this.getAuthErrorCode();

    // Check if we should show the error
    let shouldShow = !!errorCode;

    // Only render connection_failed for "general" and "connection" types
    if (errorCode === "connection_failed" && this.for !== "general" && this.for !== "connection") {
      shouldShow = false;
    }

    const errorMessage = shouldShow ? this.getErrorMessage(errorCode) : null;
    const formattedMessage = errorMessage?.includes("\n") ? <div style={{ whiteSpace: "pre-line" }}>{errorMessage}</div> : errorMessage;

    // For shadow: false components with slots, we must always render Host but use hidden/display
    // to control visibility, otherwise slotted content remains visible in the light DOM
    return (
      <Host
        class={`u:block ${this.componentClassName}`}
        hidden={!shouldShow}
        style={{ display: shouldShow ? undefined : "none" }}
        aria-hidden={!shouldShow ? "true" : null}
        aria-live="polite"
      >
        {this.hasSlot ? <slot /> : formattedMessage}
      </Host>
    );
  }
}