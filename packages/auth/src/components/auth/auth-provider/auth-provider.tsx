import { Component, Host, Prop, h } from "@stencil/core";
import { authStore } from "../../../store/auth-store.js";

@Component({
  tag: "auth-provider",
  shadow: false,
})
export class AuthProvider {
  @Prop() className = "";

  render() {
    if (!authStore.state.authenticated) {
      return null;
    }

    return (
      <Host class={this.className} style={{ width: "100%" }}>
        <slot />
      </Host>
    );
  }
}
