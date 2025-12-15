import { Component, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { newsletterStore } from "../../store/newsletter-store";
import * as NewsletterHelpers from "../../newsletter-helpers";

@Component({
  tag: "u-newsletter-resend-doi-button",
  shadow: false,
})
export class NewsletterResendDoiButton {
  @Prop() internalName!: string;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private get isResending(): boolean {
    return newsletterStore.state.resendingDoi.includes(this.internalName);
  }

  private get shouldShow(): boolean {
    return NewsletterHelpers.isSubscribed(this.internalName) && !NewsletterHelpers.isConfirmed(this.internalName);
  }

  private handleClick = async () => {
    if (this.isResending) return;
    await NewsletterHelpers.resendDoi(this.internalName);
  };

  render() {
    if (!this.shouldShow) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={this.handleClick}
        disabled={this.isResending || newsletterStore.state.loading}
        aria-busy={this.isResending}
        class={this.componentClassName}
      >
        {this.isResending ? t("loading") : t("newsletter.resend_doi_button")}
      </button>
    );
  }
}
