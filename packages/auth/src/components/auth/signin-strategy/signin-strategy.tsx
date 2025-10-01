import { Component, Host, h, Prop } from "@stencil/core";
import { authState } from "../../../store/auth-store";

@Component({
  tag: "signin-strategy",
  shadow: false,
})
export class SigninStrategy {
  @Prop() type!: "password" | "magic-code";
  @Prop() className = "";

  render() {
    if (authState.step !== "verification") {
      return null;
    }

    return (
      <Host class={this.className}>
        <slot />
      </Host>
    );
  }
}
