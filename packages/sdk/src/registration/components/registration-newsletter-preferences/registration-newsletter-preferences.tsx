import { Component, h, Prop, State } from "@stencil/core";
import { registrationState, registrationStore } from "../../store/registration-store";

@Component({
  tag: "u-registration-newsletter-preference",
  styleUrl: "registration-newsletter-preferences.css",
  shadow: false,
})
export class RegistrationNewsletterPreference {
  @Prop() name!: string;
  @Prop() preference!: string;
  @Prop() label!: string;
  @Prop() checked = false;
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() isChecked = false;

  componentWillLoad() {
    if (!this.name) {
      throw new Error('[u-registration-newsletter-preference] "name" prop is required.');
    }
    if (!this.preference) {
      throw new Error('[u-registration-newsletter-preference] "preference" prop is required.');
    }

    const storedPreferences = registrationState.newsletterPreferences[this.name] || [];
    if (storedPreferences.includes(this.preference)) {
      this.isChecked = true;
    } else {
      this.isChecked = this.checked;
      if (this.checked) {
        registrationStore.setNewsletterPreference(this.name, [...storedPreferences, this.preference]);
      }
    }
  }

  private handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.isChecked = input.checked;

    const currentPrefs = registrationState.newsletterPreferences[this.name] || [];

    if (this.isChecked) {
      if (!currentPrefs.includes(this.preference)) {
        registrationStore.setNewsletterPreference(this.name, [...currentPrefs, this.preference]);
      }
    } else {
      registrationStore.setNewsletterPreference(
        this.name,
        currentPrefs.filter((p) => p !== this.preference),
      );
    }
  };

  render() {
    const inputId = `${this.name}-${this.preference}`;

    return (
      <label htmlFor={inputId} class={this.componentClassName}>
        <input
          id={inputId}
          type="checkbox"
          checked={this.isChecked}
          onChange={this.handleChange}
        />
        {this.label}
      </label>
    );
  }
}
