import { Component, h, Prop, Element, State, Event, type EventEmitter } from "@stencil/core";
import { hasSlotContent } from "../../component-utils";
import { t } from "../../../i18n";
import { authState } from "../../../auth/store/auth-store";
import { getParentSigninStep } from "../../../auth/components/helpers";
import { getParentProfile } from "../../../profile/components/helpers";
import { getParentNewsletterRoot } from "../../../newsletter/components/helpers";
import type { Submittable } from "../../interfaces/submittable";

export type AuthButtonFor = "email" | "password" | "resetPassword";

type ParentContext = HTMLElement & Submittable;

@Component({
  tag: "u-submit-button",
  shadow: false,
})
export class SubmitButton {
  @Element() el!: HTMLElement;
  @Prop() for?: AuthButtonFor;
  @Prop() text?: string;
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Event() newsletterSuccess: EventEmitter<any>;
  @Event() newsletterError: EventEmitter<any>;

  @State() private loading = false;
  @State() private submitDisabled = false;

  private context: "auth" | "profile" | "newsletter" | "other" = "other";
  private hasSlot = false;

  componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
    this.context = this.detectContext();
  }

  private detectContext() {
    if (this.el.closest("u-signin-root") || this.el.closest("u-signin-step")) return "auth";

    if (this.el.closest("u-profile")) return "profile";

    if (this.el.closest("u-newsletter-root")) return "newsletter";

    throw new Error(
      "No context found for submit button. Make sure you are using the component within a u-signin-root, u-profile, or u-newsletter-root.",
    );
  }

  private getParentContext(): ParentContext {
    switch (this.context) {
      case "auth":
        return getParentSigninStep(this.el);
      case "profile":
        return getParentProfile(this.el);
      case "newsletter":
        return getParentNewsletterRoot(this.el);
      default:
        return null;
    }
  }

  private handleClick = async (event: MouseEvent) => {
    event.preventDefault();
    await this.getParentContext()?.submit();
  };

  private async isDisabled(): Promise<boolean> {
    if (this.disabled) return true;

    const parent = this.getParentContext();
    if (!parent) return false;

    if (this.context === "auth") {
      return (parent as HTMLUSigninStepElement).isSubmitDisabled(this.for);
    }

    return parent.isSubmitDisabled();
  }

  private async isLoading(): Promise<boolean> {
    const parent = this.getParentContext();
    return parent?.isLoading() ?? false;
  }

  private getButtonText(): string {
    if (this.text) return this.text;

    if (this.context === "auth") {
      return this.getAuthButtonText();
    }

    return t("buttons.submit");
  }

  private getAuthButtonText(): string {
    switch (authState.step) {
      case "email":
        return t("buttons.continue");
      case "verification":
        if (this.for === "password") {
          return t("auth.password.buttonText", { defaultValue: "Sign In with Password" });
        }
        return t("buttons.submit");
      case "reset-password":
        if (this.for === "resetPassword") {
          return t("auth.resetPassword.buttonTextSet", { defaultValue: "Set Password" });
        }
        return t("buttons.submit");
      default:
        return t("buttons.submit");
    }
  }

  private shouldRender(): boolean {
    if (this.context !== "auth") return true;

    if (!authState.availableLoginOptions?.password && this.for === "password") {
      return false;
    }

    if (authState.step === "email") {
      return this.for === "email";
    }

    if (authState.step === "verification") {
      return this.for === "password" && authState.magicCodeStep !== "sent";
    }

    if (authState.step === "reset-password") {
      return this.for === "resetPassword";
    }

    return false;
  }

  private getButtonContent() {
    if (this.loading) {
      return <u-spinner />;
    }

    if (this.hasSlot) {
      return <slot />;
    }

    return this.getButtonText();
  }

  async componentWillRender() {
    this.loading = await this.isLoading();
    this.submitDisabled = await this.isDisabled();
  }

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    const buttonClasses = [
      this.componentClassName,
      this.context === "auth" ? "flex justify-center" : "",
      "disabled:opacity-50 disabled:cursor-not-allowed",
    ].join(" ");

    const buttonProps: any = {
      type: "submit",
      part: `${this.context}-submit-button`,
      disabled: this.submitDisabled || this.loading,
      class: buttonClasses,
      onClick: this.handleClick,
      "aria-live": "polite",
    };

    return <button {...buttonProps}>{this.getButtonContent()}</button>;
  }
}
