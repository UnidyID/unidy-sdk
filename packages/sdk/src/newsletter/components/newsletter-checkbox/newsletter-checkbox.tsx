import { Component, h, Prop, State } from "@stencil/core";
import { newsletterStore } from "../../store/newsletter-store";
import * as NewsletterHelpers from "../../newsletter-helpers";

@Component({
  tag: "u-newsletter-checkbox",
  shadow: false,
})
export class NewsletterCheckbox {
  @Prop() label?: string;
  @Prop() internalName!: string;
  @Prop() checked = false;
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() displayLabel = "";

  componentWillLoad() {
    this.updateDisplayLabel();

    if (this.checked && !this.isSubscribed) {
      const checkedNewsletters = newsletterStore.state.checkedNewsletters;
      if (!checkedNewsletters.includes(this.internalName)) {
        newsletterStore.set("checkedNewsletters", [...checkedNewsletters, this.internalName]);
      }
    }

    newsletterStore.onChange("newsletterConfigs", () => {
      this.updateDisplayLabel();
    });
  }

  private get isSubscribed(): boolean {
    return NewsletterHelpers.isSubscribed(this.internalName);
  }

  private get isChecked(): boolean {
    return this.isSubscribed || newsletterStore.state.checkedNewsletters.includes(this.internalName);
  }

  private updateDisplayLabel() {
    this.displayLabel = this.label || NewsletterHelpers.getNewsletterTitle(this.internalName) || this.internalName;
  }

  private toggle = () => {
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

  private handleClick = (e: Event) => {
    e.preventDefault();
    this.toggle();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.toggle();
    }
  };

  render() {
    const isLoggedIn = newsletterStore.state.isAuthenticated || newsletterStore.state.preferenceToken !== "";
    return (
      // biome-ignore lint/a11y/noLabelWithoutControl: <explanation>
      <label
        part="label"
        class={this.componentClassName}
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
        tabIndex={0}
        role={this.isSubscribed ? "text" : "checkbox"}
        aria-checked={this.isSubscribed ? undefined : this.isChecked}
      >
        <span part="label-text">{this.displayLabel}</span>

        {!isLoggedIn && <input type="checkbox" checked={this.isChecked} part="input" tabIndex={-1} />}
      </label>
    );
  }
}
