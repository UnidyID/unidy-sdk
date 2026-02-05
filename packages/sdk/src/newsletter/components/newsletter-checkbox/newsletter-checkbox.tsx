import { Component, h, Method, Prop } from "@stencil/core";
import * as NewsletterHelpers from "../../newsletter-helpers";
import { newsletterStore } from "../../store/newsletter-store";

@Component({
  tag: "u-newsletter-checkbox",
  shadow: false,
})
export class NewsletterCheckbox {
  /** The internal name of the newsletter (as configured in the backend). */
  @Prop() internalName!: string;
  /** If true, the checkbox will be checked by default. */
  @Prop() checked = false;
  /** CSS classes to apply to the checkbox element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  componentWillLoad() {
    if (this.checked && !this.isSubscribed) {
      const checkedNewsletters = newsletterStore.state.checkedNewsletters;
      if (!(this.internalName in checkedNewsletters)) {
        newsletterStore.set("checkedNewsletters", {
          ...checkedNewsletters,
          [this.internalName]: [],
        });
      }
    }
  }

  private get isSubscribed(): boolean {
    return NewsletterHelpers.isSubscribed(this.internalName);
  }

  private get isChecked(): boolean {
    return this.isSubscribed || this.internalName in newsletterStore.state.checkedNewsletters;
  }

  private syncToStore(checked: boolean) {
    if (checked) {
      const prefs = newsletterStore.state.defaultPreferences[this.internalName];
      const defaultPrefs: string[] = prefs ? Array.from(prefs) : [];

      newsletterStore.set("checkedNewsletters", {
        ...newsletterStore.state.checkedNewsletters,
        [this.internalName]: defaultPrefs,
      });
    } else {
      const { [this.internalName]: _, ...rest } = newsletterStore.state.checkedNewsletters;
      newsletterStore.set("checkedNewsletters", rest);
    }
  }

  private handleChange = () => {
    if (this.isSubscribed) return;
    this.syncToStore(!this.isChecked);
  };

  /** Public method to toggle the checkbox programmatically */
  @Method()
  async toggle() {
    this.handleChange();
  }

  /** Public method to set the checkbox state programmatically */
  @Method()
  async setChecked(checked: boolean) {
    if (this.isSubscribed) return;
    if (checked !== this.isChecked) {
      this.syncToStore(checked);
    }
  }

  render() {
    return (
      <input
        type="checkbox"
        checked={this.isChecked}
        disabled={this.isSubscribed}
        onChange={this.handleChange}
        class={this.componentClassName}
        aria-checked={this.isChecked}
      />
    );
  }
}
