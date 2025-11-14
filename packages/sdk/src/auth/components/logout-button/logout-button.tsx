import { Component, h, Prop, type EventEmitter, Event } from "@stencil/core";
import { Auth } from "../../auth";

@Component({
  tag: "u-logout-button",
  shadow: false,
})
export class LogoutButton {
  @Prop() text = "Logout";
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() reloadOnSuccess = true;

  @Event() logout!: EventEmitter<void>;

  private handleLogout = async () => {
    const auth = await Auth.getInstance();
    const result = await auth.logout();

    if (result === true) {
      this.logout.emit();

      if (this.reloadOnSuccess) {
        window.location.reload();
      }
    }
  };

  render() {
    return (
      <button type="button" class={this.componentClassName} onClick={this.handleLogout}>
        {this.text}
      </button>
    );
  }
}
