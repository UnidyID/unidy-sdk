import { Component, h, Prop, type EventEmitter, Event } from "@stencil/core";
import { Auth } from "../../auth";
import i18n from "../../../i18n";

@Component({
  tag: "u-logout-button",
  shadow: false,
})
export class LogoutButton {
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
        {i18n.t("buttons.logout")}
      </button>
    );
  }
}
