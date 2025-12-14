import { Component, h, Prop } from "@stencil/core";
import { NewsletterHelpers } from "../../newsletter-helpers";
import { t } from "../../../i18n";
import { Flash } from "../../../shared/store/flash-store";

@Component({
  tag: "u-newsletter-logout-button",
  shadow: false,
})
export class LogoutButton {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private handleLogout = () => {
    NewsletterHelpers.logout();
    Flash.success.addMessage(t("newsletter.logout_success"));
  };

  render() {
    return (
      <button type="button" class={this.componentClassName} onClick={this.handleLogout} aria-live="polite">
        {t("buttons.logout")}
      </button>
    );
  }
}
