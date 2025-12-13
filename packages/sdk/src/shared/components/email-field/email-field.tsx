import { Component, h, Prop, Element } from "@stencil/core";
import { t } from "../../../i18n";
import { authStore, authState } from "../../../auth/store/auth-store";
import { newsletterStore } from "../../../newsletter/store/store";
import { getParentSigninStep } from "../../../auth/components/helpers";

@Component({
  tag: "u-email-field",
  shadow: false,
})
export class EmailField {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() placeholder?: string;
  @Prop() ariaLabel = "Email";
  @Prop() disabled = false;

  private get isAuthContext(): boolean {
    return !!this.el.closest("u-signin-root");
  }

  private get isNewsletterContext(): boolean {
    return !!this.el.closest("u-newsletter-root");
  }

  private getCurrentStore(): typeof authStore | typeof newsletterStore | null {
    if (this.isAuthContext) {
      return authStore;
    }
    if (this.isNewsletterContext) {
      return newsletterStore;
    }

    throw new Error("No store found for email field. Make sure you are using the component within a u-signin-root or u-newsletter-root.");
  }

  private getEmailValue(): string {
    return this.getCurrentStore().state.email
  }


  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;

    const store = this.getCurrentStore();
    store.setEmail(target.value);
  };

  private handleSubmit = async (event: Event) => {
    event.preventDefault();

    const emailValue = this.getEmailValue();
    if (emailValue === "") {
      return;
    }

    if (this.isAuthContext) {
      return await getParentSigninStep(this.el)?.submit();
    }

    if (this.isNewsletterContext) {
      // newsletter submit logic here ?
    }
  };

  render() {
    const placeholderText = this.placeholder || t("auth.email.placeholder", { defaultValue: "Enter your email" });
    const isDisabled = this.disabled || (this.isAuthContext && (authState.loading || authState.step === "verification" || authState.step === "registration"));

    return (
      <form onSubmit={this.handleSubmit}>
        <input
          id="email"
          type="email"
          value={ this.getEmailValue()}
          autocomplete="email"
          placeholder={placeholderText}
          disabled={isDisabled}
          class={`${this.componentClassName} disabled:opacity-40 disabled:cursor-not-allowed`}
          onInput={this.handleInput}
          aria-label={this.ariaLabel}
        />
      </form>
    );
  }
}
