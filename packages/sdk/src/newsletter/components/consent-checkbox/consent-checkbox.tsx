import { Component, h, Method, Prop } from "@stencil/core";
import { newsletterStore } from "../../store/newsletter-store";

@Component({
  tag: "u-newsletter-consent-checkbox",
  shadow: false,
})
export class NewsletterConsentCheckbox {
  private static readonly DEFAULT_CONSENT_KEY = "_consent";

  /** CSS classes to apply to the checkbox element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;
  /** Unique key used to store this consent state. */
  @Prop({ attribute: "key" }) consentKey?: string;

  private get resolvedConsentKey() {
    return this.consentKey || NewsletterConsentCheckbox.DEFAULT_CONSENT_KEY;
  }

  componentWillLoad() {
    newsletterStore.state.consentRequired = {
      ...newsletterStore.state.consentRequired,
      [this.resolvedConsentKey]: true,
    };

    if (!(this.resolvedConsentKey in newsletterStore.state.consentGiven)) {
      newsletterStore.state.consentGiven = {
        ...newsletterStore.state.consentGiven,
        [this.resolvedConsentKey]: false,
      };
    }
  }

  private get isChecked() {
    return newsletterStore.state.consentGiven[this.resolvedConsentKey] ?? false;
  }

  private clearConsentError() {
    if (newsletterStore.state.errors.consent) {
      const { consent: _, ...rest } = newsletterStore.state.errors;
      newsletterStore.state.errors = rest;
    }
  }

  private handleChange = () => {
    const newValue = !this.isChecked;
    newsletterStore.state.consentGiven = {
      ...newsletterStore.state.consentGiven,
      [this.resolvedConsentKey]: newValue,
    };

    if (newValue) {
      this.clearConsentError();
    }
  };

  @Method()
  async toggle() {
    this.handleChange();
  }

  @Method()
  async setChecked(checked: boolean) {
    if (checked !== this.isChecked) {
      newsletterStore.state.consentGiven = {
        ...newsletterStore.state.consentGiven,
        [this.resolvedConsentKey]: checked,
      };

      if (checked) {
        this.clearConsentError();
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
