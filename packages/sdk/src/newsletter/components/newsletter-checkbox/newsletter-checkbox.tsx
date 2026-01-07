import { Component, h, Prop } from "@stencil/core";
import * as NewsletterHelpers from "../../newsletter-helpers";
import { newsletterStore } from "../../store/newsletter-store";

@Component({
  tag: "u-newsletter-checkbox",
  shadow: false,
})
export class NewsletterCheckbox {
  @Prop() internalName!: string;
  @Prop() checked = false;
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

  private handleChange = () => {
    if (this.isSubscribed) return;

    const currentlyChecked = this.internalName in newsletterStore.state.checkedNewsletters;

    if (currentlyChecked) {
      const { [this.internalName]: _, ...rest } = newsletterStore.state.checkedNewsletters;
      newsletterStore.set("checkedNewsletters", rest);
    } else {
      const prefs = newsletterStore.state.defaultPreferences[this.internalName];
      const defaultPrefs: string[] = prefs ? Array.from(prefs) : [];

      newsletterStore.set("checkedNewsletters", {
        ...newsletterStore.state.checkedNewsletters,
        [this.internalName]: defaultPrefs,
      });
    }
  };

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
