import { Component, Host, h, Prop } from "@stencil/core";
import { authStore } from "../../store/auth-store";

@Component({
  tag: "u-signed-in",
  shadow: false,
})
export class SignedIn {
  /** CSS classes to apply to the host element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";
  /** If true, shows content when user is NOT signed in (inverts the condition). */
  @Prop() not = false;

  render() {
    const shouldShow = this.not ? !authStore.state.authenticated : authStore.state.authenticated;

    return (
      <Host
        class={this.componentClassName}
        hidden={!shouldShow}
        style={{ display: shouldShow ? undefined : "none" }}
        aria-hidden={!shouldShow ? "true" : null}
        aria-live="polite"
      >
        <slot />
      </Host>
    );
  }
}
