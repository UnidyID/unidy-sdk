import { Component, Host, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotFactory } from "../../../shared/base/has-slot-content";
import { Flash } from "../../../shared/store/flash-store";
import { newsletterLogout } from "../../newsletter-helpers";
import { newsletterStore } from "../../store/newsletter-store";

@Component({
  tag: "u-newsletter-logout-button",
  shadow: false,
})
export class NewsletterLogoutButton extends UnidyComponent(HasSlotFactory) {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private handleLogout = () => {
    newsletterLogout();
    Flash.success.addMessage(t("newsletter.success.logout"));
  };

  render() {
    if (newsletterStore.state.preferenceToken === "" || newsletterStore.state.isAuthenticated) {
      return <Host style={{ display: "none" }} />;
    }

    return (
      <Host>
        <button
          type="button"
          part="button"
          class={this.componentClassName}
          onClick={this.handleLogout}
          aria-label="Logout"
          aria-live="polite"
        >
          {this.hasSlot ? <slot /> : t("newsletter.buttons.logout")}
        </button>
      </Host>
    );
  }
}
