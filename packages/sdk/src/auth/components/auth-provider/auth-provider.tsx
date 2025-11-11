import { Component, Host, Prop, h } from "@stencil/core";
import { authStore } from "../../store/auth-store.js";

@Component({
  tag: "u-auth-provider",
  shadow: true,
})
export class AuthProvider {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  render() {
    if (!authStore.state.authenticated) {
      return null;
    }

    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
