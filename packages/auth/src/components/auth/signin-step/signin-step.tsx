import { Component, Host, h, Prop, Method } from "@stencil/core";
import { authState } from "../../../store/auth-store";
import { Auth } from "../../..";

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

  private handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (authState.loading) return;

    const authService = await Auth.getInstance();
    if (!authService) {
      console.error("Auth service not initialized");
      return;
    }

    if (authState.step === "email") {
      await authService.createSignIn(authState.email);
    } else if (authState.step === "verification") {
      await authService.authenticateWithPassword(authState.password);
    }
  };

  render() {
    const isActive =
      this.name === "email"
        ? authState.step === "email"
        : this.name === "verification"
          ? authState.step === "verification" || authState.step === "magic-code"
          : false;

    return (
      <Host style={{ display: isActive ? "block" : "none" }}>
        <form onSubmit={this.handleSubmit}>
          <slot />
        </form>
      </Host>
    );
  }
}
