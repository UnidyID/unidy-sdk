import { Component, h, Prop, Element, Host } from "@stencil/core";
import { newsletterLogout } from "../../newsletter-helpers";
import { t } from "../../../i18n";
import { Flash } from "../../../shared/store/flash-store";
import { newsletterStore } from "../../store/newsletter-store";
import { hasSlotContent } from "../../../shared/component-utils";

@Component({
  tag: "u-newsletter-logout-button",
  shadow: false,
})
export class LogoutButton {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName = "";

  private handleLogout = () => {
    newsletterLogout();
    Flash.success.addMessage(t("newsletter.success.logout"));
  };

  render() {
    if (newsletterStore.state.preferenceToken === "" || newsletterStore.state.isAuthenticated) {
      return <Host style={{ display: "none" }} />;
    }

    const hasContent = hasSlotContent(this.el);

    return (
      <Host>
        <button
          type="button"
          part="button"
          class={this.componentClassName}
          onClick={this.handleLogout}
          aria-label={hasContent ? "Logout" : undefined}
          aria-live="polite"
        >
          {hasContent ? <slot /> : t("newsletter.buttons.logout")}
        </button>
      </Host>
    );
  }
}
