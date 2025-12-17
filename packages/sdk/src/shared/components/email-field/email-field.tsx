import { Component, h, Prop, Element } from "@stencil/core";
import { t } from "../../../i18n";
import { authStore, authState } from "../../../auth/store/auth-store";
import { newsletterStore } from "../../../newsletter/store/newsletter-store";

import { getParentSigninStep } from "../../../auth/components/helpers";
import { getParentNewsletterRoot } from "../../../newsletter/components/helpers";

@Component({
  tag: "u-email-field",
  shadow: false,
})
export class EmailField {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() ariaLabel = "Email";
  @Prop() disabled = false;

  private get context(): "auth" | "newsletter" | null {
    if (this.el.closest("u-signin-root")) return "auth";

    if (this.el.closest("u-newsletter-root")) return "newsletter";

    return null;
  }

  private get store(): typeof authStore | typeof newsletterStore | null {
    switch (this.context) {
      case "auth":
        return authStore;
      case "newsletter":
        return newsletterStore;
      default:
        throw new Error(
          "No store found for email field. Make sure you are using the component within a u-signin-root or u-newsletter-root.",
        );
    }
  }

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;

    (this.store as { state: { email: string } }).state.email = target.value;
  };

  private handleSubmit = async (event: Event) => {
    event.preventDefault();

    if (this.store.state.email === "") return;

    if (this.context === "auth") return await getParentSigninStep(this.el)?.submit();

    if (this.context === "newsletter") return await getParentNewsletterRoot(this.el)?.submit();
  };

  render() {
    const placeholderText = t("auth.email.placeholder", { defaultValue: "Enter your email" });
    const isDisabled =
      this.disabled ||
      (this.context === "auth" && (authState.loading || authState.step === "verification" || authState.step === "registration"));

    return (
      <form onSubmit={this.handleSubmit}>
        <input
          id="email"
          type="email"
          value={this.store.state.email}
          autocomplete="email"
          placeholder={placeholderText}
          disabled={isDisabled}
          class={`${this.componentClassName} u:disabled:opacity-40 u:disabled:cursor-not-allowed`}
          onInput={this.handleInput}
          aria-label={this.ariaLabel}
        />
      </form>
    );
  }
}
