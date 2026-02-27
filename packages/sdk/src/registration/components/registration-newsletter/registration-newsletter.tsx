import { Component, h, Prop, State } from "@stencil/core";
import { registrationState, registrationStore } from "../../store/registration-store";

@Component({
  tag: "u-registration-newsletter",
  styleUrl: "registration-newsletter.css",
  shadow: false,
})
export class RegistrationNewsletter {
  /** The internal name of the newsletter (must match the newsletter configured in Unidy). */
  @Prop() name!: string;

  /** Whether the checkbox is initially checked. */
  @Prop() checked = false;

  /** CSS classes to apply to the checkbox element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() isChecked = false;

  componentWillLoad() {
    if (!this.name) {
      throw new Error('[u-registration-newsletter] "name" prop is required.');
    }

    const storedPreferences = registrationState.newsletterPreferences[this.name];
    if (storedPreferences && storedPreferences.length > 0) {
      this.isChecked = true;
    } else {
      this.isChecked = this.checked;
      if (this.checked) {
        registrationStore.setNewsletterPreference(this.name, ["subscribed"]);
      }
    }
  }

  private handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.isChecked = input.checked;

    if (this.isChecked) {
      registrationStore.setNewsletterPreference(this.name, ["subscribed"]);
    } else {
      registrationStore.setNewsletterPreference(this.name, []);
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
