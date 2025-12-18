import { Component, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { newsletterStore } from "../../store/newsletter-store";
import * as NewsletterHelpers from "../../newsletter-helpers";
import { Flash } from "../../../shared/store/flash-store";

@Component({
  tag: "u-newsletter-subscribe-button",
  shadow: false,
})
export class NewsletterSubscribeButton {
  @Prop() internalName!: string;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() subscribing = false;

  private get isSubscribed(): boolean {
    return NewsletterHelpers.isSubscribed(this.internalName);
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
      const title = NewsletterHelpers.getNewsletterTitle(this.internalName) ?? this.internalName;
      Flash.success.addMessage(t("newsletter.success.subscribe", { newsletterName: title }));
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
        disabled={this.subscribing}
        aria-busy={this.subscribing}
        class={`${this.componentClassName} flex items-center justify-center`}
      >
        {this.subscribing ? <u-spinner /> : t("newsletter.buttons.subscribe")}
      </button>
    );
  }
}
