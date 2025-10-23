import { Component, Host, Prop, h } from "@stencil/core";
import { authStore } from "../../../store/auth-store.js";

@Component({
  tag: "auth-provider",
  shadow: true,
})
export class AuthProvider {
  @Prop() customStyle = "";

  render() {
    if (!authStore.state.authenticated) {
      return null;
    }

    return (
      <Host class={this.customStyle} style={{ width: "100%" }}>
        <slot />
      </Host>
    );
  }
}
