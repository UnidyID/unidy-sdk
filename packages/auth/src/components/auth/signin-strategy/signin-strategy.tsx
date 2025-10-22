import { Component, Host, h, Prop } from "@stencil/core";

@Component({
  tag: "signin-strategy",
  shadow: false,
})
export class SigninStrategy {
  @Prop() type!: "password" | "magic-code";
  @Prop() customStyle = "";

  render() {
    return (
      <Host class={this.customStyle}>
        <slot />
      </Host>
    );
  }
}
