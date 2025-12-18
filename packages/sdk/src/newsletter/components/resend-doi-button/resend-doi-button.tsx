import { Component, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import * as NewsletterHelpers from "../../newsletter-helpers";
import { Flash } from "../../../shared/store/flash-store";

@Component({
  tag: "u-newsletter-resend-doi-button",
  shadow: false,
})
export class NewsletterResendDoiButton {
  @Prop() internalName!: string;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() isResending = false;

  private get shouldShow(): boolean {
    return NewsletterHelpers.isSubscribed(this.internalName) && !NewsletterHelpers.isConfirmed(this.internalName);
  }

  private handleClick = async () => {
    this.isResending = true;
    const success = await NewsletterHelpers.resendDoi(this.internalName);
    this.isResending = false;

    if (success) {
      Flash.success.addMessage(t("newsletter.success.doi_sent"));
    } else {
      Flash.error.addMessage(t("newsletter.errors.resend_doi_failed"));
    }
  };

  render() {
    if (!this.shouldShow) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={this.handleClick}
        disabled={this.isResending}
        aria-busy={this.isResending}
        aria-live="polite"
        class={`${this.componentClassName} flex items-center justify-center`}
      >
        {this.isResending ? <u-spinner /> : t("newsletter.buttons.resend_doi")}
      </button>
    );
  }
}
