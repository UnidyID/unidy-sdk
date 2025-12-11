import { Component, Host, h, Prop } from "@stencil/core";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-signin-strategy",
  shadow: false,
})
export class SigninStrategy {
  @Prop() type!: "password" | "magic-code";
  @Prop({ attribute: "class-name" }) componentClassName = "";

  render() {
    let shouldRender = false;

    if (this.type === "password") {
      shouldRender = authState.step === "verification" && authState.availableLoginOptions?.password;
    } else if (this.type === "magic-code") {
      shouldRender = authState.step === "magic-code" && authState.availableLoginOptions?.magic_link;
    }

    if (!shouldRender) {
      return null;
    }

    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
