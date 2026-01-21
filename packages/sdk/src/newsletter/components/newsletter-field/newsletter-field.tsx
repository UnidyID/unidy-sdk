import { Component, Element, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import type { AdditionalFieldName } from "../../store/newsletter-store";
import { newsletterStore } from "../../store/newsletter-store";
import { getParentNewsletterRoot } from "../helpers";

/**
 * A field component for capturing additional subscriber information in newsletter forms.
 * Supports all additional fields defined in the API schema (first_name, last_name, phone_number, etc.)
 *
 * @example
 * ```html
 * <u-newsletter-field field="first_name" placeholder="Enter your first name"></u-newsletter-field>
 * <u-newsletter-field field="phone_number" placeholder="Enter your phone number"></u-newsletter-field>
 * ```
 */
@Component({
  tag: "u-newsletter-field",
  shadow: false,
})
export class NewsletterField {
  @Element() el!: HTMLElement;

  /** The field name to capture (e.g., first_name, last_name, phone_number, etc.) */
  @Prop() field!: AdditionalFieldName;

  /** Custom CSS class name to apply to the input element */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /** Whether the field is required */
  @Prop() required = false;

  /** Placeholder text for the input */
  @Prop() placeholder?: string;

  /** Aria label for accessibility */
  @Prop() ariaLabel?: string;

  /** Whether the field is disabled */
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

    // Try to get a translated placeholder
    const translationKey = `newsletter.fields.${this.field}.placeholder`;
    const translated = t(translationKey);

    // If no translation found, generate a default placeholder from field name
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

    // Clear any error for this field
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
    // Disable fields when user is already logged in (has preference token and email)
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
