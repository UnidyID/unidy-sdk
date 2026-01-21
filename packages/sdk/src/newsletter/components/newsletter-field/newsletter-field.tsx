import { Component, Element, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import type { AdditionalFieldName } from "../../store/newsletter-store";
import { newsletterStore } from "../../store/newsletter-store";
import { getParentNewsletterRoot } from "../helpers";

@Component({
  tag: "u-newsletter-field",
  shadow: false,
})
export class NewsletterField {
  @Element() el!: HTMLElement;

  @Prop() field!: AdditionalFieldName;
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() required = false;
  @Prop() placeholder?: string;
  @Prop() ariaLabel?: string;
  @Prop() disabled = false;

  private get inputType(): string {
    switch (this.field) {
      case "phone_number":
        return "tel";
      case "date_of_birth":
        return "date";
      default:
        return "text";
    }
  }

  private get autocomplete(): string {
    switch (this.field) {
      case "first_name":
        return "given-name";
      case "last_name":
        return "family-name";
      case "phone_number":
        return "tel";
      case "company_name":
        return "organization";
      case "address_line_1":
        return "address-line1";
      case "address_line_2":
        return "address-line2";
      case "city":
        return "address-level2";
      case "postal_code":
        return "postal-code";
      case "country_code":
        return "country";
      case "date_of_birth":
        return "bday";
      default:
        return "off";
    }
  }

  private get placeholderText(): string {
    if (this.placeholder) return this.placeholder;

    const translationKey = `newsletter.fields.${this.field}.placeholder`;
    const translated = t(translationKey);

    if (translated === translationKey) {
      return this.field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }

    return translated;
  }

  private get currentValue(): string {
    const value = newsletterStore.state.additionalFields[this.field] as string | null | undefined;
    return value ?? "";
  }

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = target.value || null;

    newsletterStore.state.additionalFields = {
      ...newsletterStore.state.additionalFields,
      [this.field]: value,
    };

    if (newsletterStore.state.errors[this.field]) {
      const { [this.field]: _, ...restErrors } = newsletterStore.state.errors;
      newsletterStore.state.errors = restErrors;
    }
  };

  private handleSubmit = async (event: Event) => {
    event.preventDefault();
    await getParentNewsletterRoot(this.el)?.submit();
  };

  private isDisabled(): boolean {
    if (this.disabled) return true;

    // disable when logged in
    return !!newsletterStore.state.preferenceToken && !!newsletterStore.state.email;
  }

  render() {
    const label = this.ariaLabel ?? this.placeholderText;

    return (
      <form onSubmit={this.handleSubmit}>
        <input
          id={`newsletter-field-${this.field}`}
          type={this.inputType}
          value={this.currentValue}
          autocomplete={this.autocomplete}
          placeholder={this.placeholderText}
          disabled={this.isDisabled()}
          required={this.required}
          class={`${this.componentClassName} u:disabled:opacity-40 u:disabled:bg-gray-200 u:disabled:cursor-not-allowed`}
          onInput={this.handleInput}
          aria-label={label}
        />
        <slot />
      </form>
    );
  }
}
