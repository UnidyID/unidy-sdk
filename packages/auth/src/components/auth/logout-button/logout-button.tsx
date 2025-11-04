import { Component, h, Prop, type EventEmitter, Event } from "@stencil/core";
import { Auth } from "../../../auth";

@Component({
  tag: "logout-button",
  shadow: false,
})
export class LogoutButton {
  @Prop() text = "Logout";
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() reloadOnSuccess = true;

  @Event() onLogout!: EventEmitter<void>;

  private handleLogout = async () => {
    const auth = await Auth.getInstance();
    const result = await auth.logout();

    if (typeof result === "boolean" && result === true) {
      this.onLogout.emit();

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
