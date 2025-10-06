import { Component, Host, h, Prop, Method } from "@stencil/core";
import { authState } from "../../../store/auth-store";

@Component({
  tag: "signin-step",
  shadow: false,
})
export class SigninStep {
  @Prop() name!: "email" | "verification";
  @Prop() alwaysRender = false;

  @Method()
  async isActive(): Promise<boolean> {
    return authState.step === this.name || this.alwaysRender;
  }

  render() {
    const isActive = authState.step === this.name || this.alwaysRender;

    return (
      <Host style={{ display: isActive ? "block" : "none" }}>
        <slot />
      </Host>
    );
  }
}
