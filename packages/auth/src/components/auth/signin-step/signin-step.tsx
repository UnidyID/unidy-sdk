import { Component, Host, h, Prop, Method } from "@stencil/core";
import { authState } from "../../../store/auth-store";

@Component({
  tag: "signin-step",
  shadow: false,
})
export class SigninStep {
  @Prop() name!: "email" | "verification";
  @Prop() alwaysRender = false;

  render() {
    const isActive =
      this.name === "email"
        ? authState.step === "email"
        : this.name === "verification"
          ? authState.step === "verification" || authState.step === "magic-code"
          : false;

    return (
      <Host style={{ display: isActive ? "block" : "none" }}>
        <slot />
      </Host>
    );
  }
}
