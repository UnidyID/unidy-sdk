import {Component, h, Prop, type EventEmitter, Event, Element} from "@stencil/core";
import { Auth } from "../../auth";
import { t } from "../../../i18n";
import {hasSlotContent} from "../../../shared/component-utils";

@Component({
  tag: "u-logout-button",
  shadow: false,
})
export class LogoutButton {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() reloadOnSuccess = true;

  @Event() logout!: EventEmitter<void>;
  private hasSlot = false;

  async componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
  }

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
        {this.hasSlot ? <slot /> : t("buttons.logout")}
      </button>
    );
  }
}
