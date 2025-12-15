import { Component, Host, Prop, h } from "@stencil/core";
import { authStore } from "../../store/auth-store";

@Component({
  tag: "u-signed-in",
  shadow: true,
})
export class SignedIn {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() not = false;

  render() {
    if (this.not ? !authStore.state.authenticated : authStore.state.authenticated) {
      return null;
    }

    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
