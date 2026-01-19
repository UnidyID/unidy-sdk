import { Component, h, Method, Prop, State } from "@stencil/core";
import { newsletterStore } from "../../store/newsletter-store";

@Component({
  tag: "u-newsletter-consent-checkbox",
  shadow: false,
})
export class NewsletterConsentCheckbox {
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() isChecked = false;

  componentWillLoad() {
    this.isChecked = newsletterStore.state.consentGiven;
  }

  private handleChange = () => {
    const newValue = !this.isChecked;
    newsletterStore.state.consentGiven = newValue;

    if (newValue && newsletterStore.state.errors.consent) {
      const { consent: _, ...rest } = newsletterStore.state.errors;
      newsletterStore.state.errors = rest;
    }
  };

  @Method()
  async toggle() {
    this.handleChange();
  }

  @Method()
  async setChecked(checked: boolean) {
    if (checked !== this.isChecked) {
      newsletterStore.state.consentGiven = checked;

      if (checked && newsletterStore.state.errors.consent) {
        const { consent: _, ...rest } = newsletterStore.state.errors;
        newsletterStore.state.errors = rest;
      }
    }
  }

  render() {
    return (
      <input
        type="checkbox"
        checked={this.isChecked}
        onChange={this.handleChange}
        class={this.componentClassName}
        aria-checked={this.isChecked}
        aria-required="true"
        data-consent-checkbox
      />
    );
  }
}
