import { Component, Host, h } from "@stencil/core";
import { authStore } from "../../../store/auth-store.js";

@Component({
  tag: "auth-provider",
  shadow: false,
})
export class AuthProvider {
  render() {
    if (!authStore.state.authenticated) {
      return null;
    }

    return (
      <Host style={{ width: "100%" }}>
        <slot />
      </Host>
    );
  }
}
