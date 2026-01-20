import { Component, Element, Host, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { hasSlotContent } from "../../../shared/component-utils";
import { Flash } from "../../../shared/store/flash-store";
import { newsletterLogout } from "../../newsletter-helpers";
import { newsletterStore } from "../../store/newsletter-store";

@Component({
  tag: "u-newsletter-logout-button",
  shadow: false,
})
export class LogoutButton {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName = "";

  private hasSlot = false;

  async componentWillLoad() {
    // this needs to be evaluated on load, bc doing it on render will evaluate the generated dom for "shadow: false"
    // components and always return true on re-render
    this.hasSlot = hasSlotContent(this.el);
  }

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
