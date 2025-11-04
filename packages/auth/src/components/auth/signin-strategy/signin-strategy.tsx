import { Component, Host, h, Prop } from "@stencil/core";
import { authState } from "../../../store/auth-store";

@Component({
  tag: "signin-strategy",
  shadow: false,
})
export class SigninStrategy {
  @Prop() type!: "password" | "magic-code";
  @Prop({ attribute: "class-name" }) componentClassName = "";

  render() {
    let shouldRender = false;

    if (this.type === "password") {
      shouldRender = authState.step === "verification";
    } else if (this.type === "magic-code") {
      shouldRender = authState.step === "magic-code";
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
