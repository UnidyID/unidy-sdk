import { Component, h, Prop } from "@stencil/core";
import { type AuthButtonFor, authContext } from "../../../auth/components/submit-button/auth-submit-button";
import { t } from "../../../i18n";
import { type NewsletterButtonFor, newsletterContext } from "../../../newsletter/components/submit-button/newsletter-submit-button";
import { profileContext } from "../../../profile/components/submit-button/profile-submit-button";
import { UnidyComponent } from "../../base/component";
import { HasSlotContent } from "../../base/has-slot-content";
import { slotFallbackText } from "../../component-utils";
import type { ComponentContext } from "../../context-utils";
import { defaultContext, type SubmitButtonContext } from "./context";

@Component({
  tag: "u-submit-button",
  styleUrl: "submit-button.css",
  shadow: false,
})
export class SubmitButton extends UnidyComponent(HasSlotContent) {
  @Prop() for?: AuthButtonFor | NewsletterButtonFor;
  @Prop() text?: string;
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private context: ComponentContext = "auth";
  private contextModule: SubmitButtonContext = defaultContext;

  async componentWillLoad() {
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
    if (this.element.closest("u-signin-root") || this.element.closest("u-signin-step")) return "auth";

    if (this.element.closest("u-profile")) return "profile";

    if (this.element.closest("u-newsletter-root")) return "newsletter";

    throw new Error(
      "No context found for submit button. Make sure you are using the component within a u-signin-root, u-profile, or u-newsletter-root.",
    );
  }

  private handleClick = async (event: MouseEvent) => {
    await this.contextModule.handleClick(event, this.element, this.for);
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

  render() {
    if (this.contextModule.shouldRender && !this.contextModule.shouldRender(this.for)) {
      return null;
    }

    const buttonClasses = [
      this.componentClassName,
      "u:flex u:justify-center u:cursor-pointer u:disabled:opacity-50 u:disabled:cursor-not-allowed ",
    ].join(" ");

    const buttonProps: Record<string, unknown> = {
      type: "submit",
      part: `${this.context}-submit-button`,
      disabled: this.isDisabled() || this.isLoading(),
      class: buttonClasses,
      onClick: this.handleClick,
      "aria-live": "polite",
    };

    return <button {...buttonProps}>{slotFallbackText(this.getButtonText(), { hasSlot: this.hasSlot, loading: this.isLoading() })}</button>;
  }
}
