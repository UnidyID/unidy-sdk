import { Component, h, Prop, State } from "@stencil/core";
import { authState, authStore } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { newsletterStore } from "../../../newsletter/store/newsletter-store";
import { UnidyComponent } from "../../base/component";
import { detectContext, findParentNewsletterRoot, findParentSigninStep } from "../../context-utils";

type EmailFieldContext = "auth" | "newsletter";

@Component({
  tag: "u-email-field",
  styleUrl: "email-field.css",
  shadow: false,
})
export class EmailField extends UnidyComponent() {
  /** CSS classes to apply to the input element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";
  /** ARIA label for accessibility. */
  @Prop() ariaLabel = "Email";
  /** If true, the input will be disabled. */
  @Prop() disabled = false;

  @State() emailValue = "";

  private get context(): EmailFieldContext | null {
    const detectedContext = detectContext(this.element);

    // Email field only supports auth and newsletter contexts
    if (detectedContext === "auth" || detectedContext === "newsletter") {
      return detectedContext;
    }

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

    if (this.context === "newsletter") {
      this.store.state.errors = {};
    } else {
      (this.store as { clearFieldError: (field: "email") => void }).clearFieldError("email");
    }
  };

  private handleSubmit = async (event: Event) => {
    event.preventDefault();

    if (this.store.state.email === "") return;

    if (this.context === "auth") return await findParentSigninStep(this.element)?.submit();

    if (this.context === "newsletter") return await findParentNewsletterRoot(this.element)?.submit();
  };

  private isDisabled(): boolean {
    if (this.disabled) return true;

    if (this.context === "auth") return authState.loading || authState.step === "verification" || authState.step === "registration";

    if (this.context === "newsletter") {
      return !!newsletterStore.state.preferenceToken && !!newsletterStore.state.email;
    }

    return false;
  }

  render() {
    const placeholderText = t("auth.email.placeholder", { defaultValue: "Enter your email" });

    return (
      <form onSubmit={this.handleSubmit}>
        <input
          id="email"
          type="email"
          value={this.store.state.email}
          autocomplete="email"
          placeholder={placeholderText}
          disabled={this.isDisabled()}
          class={`${this.componentClassName} u:disabled:opacity-40 u:disabled:bg-gray-200 u:disabled:cursor-not-allowed`}
          onInput={this.handleInput}
          aria-label={this.ariaLabel}
        />
        <slot />
      </form>
    );
  }
}
