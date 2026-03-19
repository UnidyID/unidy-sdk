import { Component, h, Prop, State } from "@stencil/core";
import { registrationState, registrationStore } from "../../store/registration-store";

@Component({
  tag: "u-registration-newsletter-preference",
  styleUrl: "registration-newsletter-preferences.css",
  shadow: false,
})
export class RegistrationNewsletterPreference {
  /** The internal name of the parent newsletter. */
  @Prop() name!: string;

  /** The preference key (e.g. "football", "tennis"). */
  @Prop() preference!: string;

  /** Whether the checkbox is initially checked. */
  @Prop() checked = false;

  /** CSS classes to apply to the checkbox element. */
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
    return (
      <input
        class={this.componentClassName}
        name={this.name}
        type="checkbox"
        checked={this.isChecked}
        onChange={this.handleChange}
        aria-checked={this.isChecked ? "true" : "false"}
      />
    );
  }
}
