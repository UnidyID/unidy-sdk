import { Component, Element, Event, type EventEmitter, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { hasSlotContent } from "../../../shared/component-utils";
import { Auth } from "../../auth";

@Component({
  tag: "u-logout-button",
  shadow: false,
})
export class LogoutButton {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() reloadOnSuccess = true;

  @Event() logout!: EventEmitter<void>;

  private handleLogout = async () => {
    const authInstance = await Auth.getInstance();

    const result = await authInstance.logout();

    if (result === true) {
      this.logout.emit();

      if (this.reloadOnSuccess) {
        window.location.reload();
      }
    }
  };

  render() {
    return (
      <button type="button" class={this.componentClassName} onClick={this.handleLogout} aria-live="polite">
        {hasSlotContent(this.el) ? <slot /> : t("buttons.logout")}
      </button>
    );
  }
}
