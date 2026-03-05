import { Component, Element, h, Method, Prop } from "@stencil/core";
import { newsletterStore } from "../../store/newsletter-store";

@Component({
  tag: "u-newsletter-consent-checkbox",
  shadow: false,
})
export class NewsletterConsentCheckbox {
  @Element() element!: HTMLElement;

  private static readonly DEFAULT_CONSENT_KEY = "_consent";

  /** CSS classes to apply to the checkbox element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;
  /** Unique key used to store this consent state. */
  @Prop({ attribute: "consent-key" }) consentKey?: string;

  private get resolvedConsentKey() {
    return this.consentKey || this.element.getAttribute("key") || NewsletterConsentCheckbox.DEFAULT_CONSENT_KEY;
  }

  private get allRequiredConsentSatisfied() {
    const requiredConsentKeys = Object.keys(newsletterStore.state.consentRequired).filter((key) => newsletterStore.state.consentRequired[key]);
    return requiredConsentKeys.every((key) => newsletterStore.state.consentGiven[key]);
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

  disconnectedCallback() {
    const { [this.resolvedConsentKey]: _, ...restRequired } = newsletterStore.state.consentRequired;
    newsletterStore.state.consentRequired = restRequired;
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

    if (newValue && this.allRequiredConsentSatisfied) {
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

      if (checked && this.allRequiredConsentSatisfied) {
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
