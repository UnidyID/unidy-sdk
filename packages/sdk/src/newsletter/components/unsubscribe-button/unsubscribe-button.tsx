import { Component, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { newsletterStore } from "../../store/newsletter-store";
import { NewsletterHelpers } from "../../newsletter-helpers";
import { Flash } from "../../../shared/store/flash-store";

@Component({
  tag: "u-newsletter-unsubscribe-button",
  shadow: false,
})
export class NewsletterUnsubscribeButton {
  @Prop() internalName!: string;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() deleting = false;

  private get isSubscribed(): boolean {
    return newsletterStore.state.existingSubscriptions.includes(this.internalName);
  }

  private handleClick = async () => {
    if (this.deleting) return;

    this.deleting = true;
    const success = await NewsletterHelpers.deleteSubscription(this.internalName);
    this.deleting = false;

    if (success) {
      const title = NewsletterHelpers.getNewsletterTitle(this.internalName) ?? this.internalName;
      Flash.info.addMessage(t("newsletter.unsubscribe_success", { newsletterName: title }));
    } else {
      Flash.error.addMessage(t("newsletter.errors.unsubscribe_failed"));
    }
  };

  render() {
    return (
        this.isSubscribed && (
          <button
            type="button"
            onClick={this.handleClick}
            disabled={this.deleting || newsletterStore.state.loading}
            aria-busy={this.deleting}
            class={this.componentClassName}
          >
            {t("newsletter.unsubscribe_button")}
          </button>
        )
    );
  }
}
