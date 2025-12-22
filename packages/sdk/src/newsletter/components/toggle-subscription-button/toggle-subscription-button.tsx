import { Component, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { newsletterStore } from "../../store/newsletter-store";
import * as NewsletterHelpers from "../../newsletter-helpers";
import { Flash } from "../../../shared/store/flash-store";

@Component({
  tag: "u-newsletter-toggle-subscription-button",
  shadow: false,
})
export class ToggleNewsletterSubscriptionButton {
  @Prop() internalName!: string;

  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop({ attribute: "subscribe-class-name" }) subscribeClassName = "";
  @Prop({ attribute: "unsubscribe-class-name" }) unsubscribeClassName = "";

  @State() loading = false;

  private get isSubscribed(): boolean {
    return NewsletterHelpers.isSubscribed(this.internalName);
  }

  private handleClick = async () => {
    if (this.loading) return;

    if (this.isSubscribed) {
      await this.handleUnsubscribe();
    } else {
      await this.handleSubscribe();
    }
  };

  private handleSubscribe = async () => {
    const { email } = newsletterStore.state;

    if (!email) {
      Flash.error.addMessage(t("newsletter.errors.email_required"));
      return;
    }

    this.loading = true;
    const success = await NewsletterHelpers.subscribeToNewsletter(this.internalName, email);
    this.loading = false;

    if (success) {
      Flash.success.addMessage(t("newsletter.success.subscribe"));
    }
  };

  private handleUnsubscribe = async () => {
    this.loading = true;
    const success = await NewsletterHelpers.deleteSubscription(this.internalName);
    this.loading = false;

    if (success) {
      Flash.info.addMessage(t("newsletter.success.unsubscribe"));
    } else {
      Flash.error.addMessage(t("newsletter.errors.unsubscribe_failed"));
    }
  };

  render() {
    const isSubscribed = this.isSubscribed;
    const stateClassName = isSubscribed ? this.unsubscribeClassName : this.subscribeClassName;

    return (
      <button
        type="button"
        onClick={this.handleClick}
        disabled={this.loading}
        aria-busy={this.loading}
        aria-label={isSubscribed ? t("newsletter.buttons.unsubscribe") : t("newsletter.buttons.subscribe")}
        aria-live="polite"
        data-subscribed={isSubscribed}
        class={`${this.componentClassName} ${stateClassName} flex items-center justify-center`.trim()}
      >
        {this.loading ? <u-spinner /> : isSubscribed ? t("newsletter.buttons.unsubscribe") : t("newsletter.buttons.subscribe")}
      </button>
    );
  }
}
