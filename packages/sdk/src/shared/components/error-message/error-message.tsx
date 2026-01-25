import { Component, Element, Host, h, Prop } from "@stencil/core";
import { authState } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { type NewsletterErrorIdentifier, newsletterStore } from "../../../newsletter/store/newsletter-store";
import { hasSlotContent } from "../../component-utils";
import { unidyState } from "../../store/unidy-store";

export type AuthErrorType = "email" | "password" | "magicCode" | "resetPassword" | "general" | "connection" | "passkey";

@Component({
  tag: "u-error-message",
  shadow: false,
  styleUrl: "error-message.css",
})
export class ErrorMessage {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() for!: string;

  @Prop() errorMessages?: Record<string, string>;
  @Element() el!: HTMLElement;

  // Must be evaluated on load, not render, because shadow: false components
  // will have their DOM modified after first render, causing hasSlotContent to return incorrect results
  private hasSlot = false;

  componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
  }

  private detectContext(): "auth" | "newsletter" | "profile" | "other" {
    if (this.el.closest("u-signin-root") || this.el.closest("u-signin-step")) return "auth";

    if (this.el.closest("u-profile")) return "profile";

    if (this.el.closest("u-newsletter-root")) return "newsletter";

    if (this.for === "general" || this.for === "connection") return "other";

    throw new Error(
      "No context found for error message. Make sure you are using the component within a u-signin-root, u-profile, or u-newsletter-root.",
    );
  }

  private get context(): "auth" | "newsletter" | "profile" | "other" {
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
    return t(`newsletter.errors.${errorIdentifier}`) || t("errors.unknown", { defaultValue: "An unknown error occurred" });
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

    // Check if we should show the error
    let shouldShow = !!errorCode;

    // Only render connection_failed for "general" and "connection" types
    if (errorCode === "connection_failed" && this.for !== "general" && this.for !== "connection") {
      shouldShow = false;
    }

    const errorMessage = shouldShow ? this.getErrorMessage(errorCode!) : null;
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
