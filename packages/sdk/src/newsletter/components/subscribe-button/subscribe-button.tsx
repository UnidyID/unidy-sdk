import { Component, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { newsletterStore } from "../../store/newsletter-store";
import { NewsletterHelpers } from "../../newsletter-helpers";
import { Flash } from "../../../shared/store/flash-store";

@Component({
  tag: "u-newsletter-subscribe-button",
  shadow: false,
})
export class NewsletterSubscribeButton {
  @Prop() internalName!: string;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() subscribing = false;
  @State() isSubscribed = false;

  componentWillLoad() {
    this.updateSubscriptionState();

    newsletterStore.onChange("existingSubscriptions", () => {
      this.updateSubscriptionState();
    });
  }

  private updateSubscriptionState() {
    this.isSubscribed = newsletterStore.state.existingSubscriptions.includes(this.internalName);
  }

  private handleClick = async () => {
    if (this.subscribing) return;

    const { email } = newsletterStore.state;

    if (!email) {
      Flash.error.addMessage(t("newsletter.errors.email_required"));
      return;
    }

    this.subscribing = true;
    const success = await NewsletterHelpers.subscribeToNewsletter(this.internalName, email);
    this.subscribing = false;

    if (success) {
      Flash.success.addMessage(t("newsletter.subscribe_success", { newsletterName: this.internalName }));
    }
  };

  render() {
    if (this.isSubscribed) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={this.handleClick}
        disabled={this.subscribing || newsletterStore.state.loading}
        aria-busy={this.subscribing}
        class={this.componentClassName}
      >
        {t("newsletter.subscribe_button")}
      </button>
    );
  }
}
