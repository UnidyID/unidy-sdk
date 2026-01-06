import { Component, Element, h, Prop } from "@stencil/core";
import { type AuthButtonFor, authContext } from "../../../auth/components/submit-button/auth-submit-button";
import { t } from "../../../i18n";
import { type NewsletterButtonFor, newsletterContext } from "../../../newsletter/components/submit-button/newsletter-submit-button";
import { profileContext } from "../../../profile/components/submit-button/profile-submit-button";
import { hasSlotContent } from "../../component-utils";
import { defaultContext, type SubmitButtonContext } from "./context";

@Component({
  tag: "u-submit-button",
  shadow: false,
})
export class SubmitButton {
  @Element() el!: HTMLElement;
  @Prop() for?: AuthButtonFor | NewsletterButtonFor;
  @Prop() text?: string;
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private context: "auth" | "profile" | "newsletter" | "other" = "other";
  private contextModule: SubmitButtonContext = defaultContext;
  private hasSlot = false;

  async componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
    this.context = this.detectContext();

    switch (this.context) {
      case "auth":
        this.contextModule = authContext;
        break;
      case "profile":
        this.contextModule = profileContext;
        break;
      case "newsletter":
        this.contextModule = newsletterContext;
        break;
      default:
        this.contextModule = defaultContext;
    }
  }

  private detectContext(): "auth" | "profile" | "newsletter" {
    if (this.el.closest("u-signin-root") || this.el.closest("u-signin-step")) return "auth";

    if (this.el.closest("u-profile")) return "profile";

    if (this.el.closest("u-newsletter-root")) return "newsletter";

    throw new Error(
      "No context found for submit button. Make sure you are using the component within a u-signin-root, u-profile, or u-newsletter-root.",
    );
  }

  private handleClick = async (event: MouseEvent) => {
    await this.contextModule.handleClick(event, this.el, this.for);
  };

  private isDisabled(): boolean {
    return this.contextModule.isDisabled(this.for, this.disabled);
  }

  private isLoading(): boolean {
    return this.contextModule.isLoading();
  }

  private getButtonText(): string {
    if (this.contextModule.getButtonText) {
      return this.contextModule.getButtonText(this.for, this.text);
    }
    if (this.text) {
      return this.text;
    }

    return t("buttons.submit");
  }

  private getButtonContent() {
    const loading = this.isLoading();

    if (loading) {
      return <u-spinner />;
    }

    if (this.hasSlot) {
      return <slot />;
    }

    return this.getButtonText();
  }

  render() {
    if (this.contextModule.shouldRender && !this.contextModule.shouldRender(this.for)) {
      return null;
    }

    const buttonClasses = [
      this.componentClassName,
      this.context === "auth" ? "u:flex u:justify-center" : "",
      "u:disabled:opacity-50 u:disabled:cursor-not-allowed",
    ].join(" ");

    const buttonProps: Record<string, unknown> = {
      type: "submit",
      part: `${this.context}-submit-button`,
      disabled: this.isDisabled() || this.isLoading(),
      class: buttonClasses,
      onClick: this.handleClick,
      "aria-live": "polite",
    };

    return <button {...buttonProps}>{this.getButtonContent()}</button>;
  }
}
