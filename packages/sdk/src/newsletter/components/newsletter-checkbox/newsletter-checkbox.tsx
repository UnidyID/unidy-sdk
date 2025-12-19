import { Component, h, Prop } from "@stencil/core";
import { newsletterStore } from "../../store/newsletter-store";
import * as NewsletterHelpers from "../../newsletter-helpers";

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
      if (!checkedNewsletters.includes(this.internalName)) {
        newsletterStore.set("checkedNewsletters", [...checkedNewsletters, this.internalName]);
      }
    }
  }

  private get isSubscribed(): boolean {
    return NewsletterHelpers.isSubscribed(this.internalName);
  }

  private get isChecked(): boolean {
    return this.isSubscribed || newsletterStore.state.checkedNewsletters.includes(this.internalName);
  }

  private handleChange = () => {
    if (this.isSubscribed) return;

    const currentlyChecked = newsletterStore.state.checkedNewsletters.includes(this.internalName);

    if (currentlyChecked) {
      newsletterStore.set(
        "checkedNewsletters",
        newsletterStore.state.checkedNewsletters.filter((name) => name !== this.internalName),
      );
    } else {
      newsletterStore.set("checkedNewsletters", [...newsletterStore.state.checkedNewsletters, this.internalName]);
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
