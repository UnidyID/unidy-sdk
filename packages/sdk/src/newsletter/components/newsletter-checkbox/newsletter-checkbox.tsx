import { Component, h, Prop, State } from "@stencil/core";
import { newsletterStore } from "../../store/newsletter-store";
import { NewsletterHelpers } from "../../newsletter-helpers";

@Component({
  tag: "u-newsletter-checkbox",
  shadow: false,
})
export class NewsletterCheckbox {
  @Prop() label?: string;
  @Prop() internalName!: string;
  @Prop() checked = false;
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() isSubscribed = false;
  @State() isChecked = false;
  @State() displayLabel = "";

  componentWillLoad() {
    this.isSubscribed = newsletterStore.state.existingSubscriptions.includes(this.internalName);
    this.isChecked = this.isSubscribed || this.checked;
    this.updateDisplayLabel();

    if (this.isChecked && !this.isSubscribed) {
      newsletterStore.set("checkedNewsletters", [...newsletterStore.get("checkedNewsletters"), this.internalName]);
    }

    newsletterStore.onChange("existingSubscriptions", () => {
      this.isSubscribed = newsletterStore.state.existingSubscriptions.includes(this.internalName);
      if (this.isSubscribed) {
        this.isChecked = true;
      }
    });

    newsletterStore.onChange("newsletterConfigs", () => {
      this.updateDisplayLabel();
    });
  }

  private updateDisplayLabel() {
    this.displayLabel = this.label || NewsletterHelpers.getNewsletterTitle(this.internalName) || this.internalName;
  }

  private toggle = () => {
    if (this.isSubscribed) return;

    this.isChecked = !this.isChecked;

    if (this.isChecked) {
      newsletterStore.set("checkedNewsletters", [...newsletterStore.get("checkedNewsletters"), this.internalName]);
    } else {
      newsletterStore.set( "checkedNewsletters", newsletterStore.state.checkedNewsletters.filter((name) => name !== this.internalName));
    }

    console.log("newsletterStore.state.checkedNewsletters", newsletterStore.state.checkedNewsletters);
  };

  private handleClick = (e: Event) => {
    e.preventDefault();
    this.toggle();
  };

  render() {
    return (
      <label part="label" class={this.componentClassName} onClick={this.handleClick}>
        <span part="label-text">{this.displayLabel}</span>
        {!newsletterStore.state.preferenceToken && (
          <input
            type="checkbox"
            checked={this.isChecked}
            part="input"
          />
        )}
        <slot name={this.isSubscribed ? "subscribed" : "not-subscribed"} />
      </label>
    );
  }
}
