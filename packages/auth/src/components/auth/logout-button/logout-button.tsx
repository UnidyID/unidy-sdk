import { Component, h, Prop } from "@stencil/core";
import { Auth } from "../../../auth";

@Component({
  tag: "logout-button",
  shadow: false,
})
export class LogoutButton {
  @Prop() text = "Logout";
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private async handleLogout() {
    const auth = await Auth.getInstance();
    auth.logout();
    window.location.reload();
  }

  render() {
    return (
      <button type="button" class={this.componentClassName} onClick={this.handleLogout}>
        {this.text}
      </button>
    );
  }
}
