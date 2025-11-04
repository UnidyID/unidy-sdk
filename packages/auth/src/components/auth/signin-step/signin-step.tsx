import { Component, Host, h, Prop, Method, Element, Listen } from "@stencil/core";
import { authState } from "../../../store/auth-store";
import { Auth } from "../../..";

@Component({
  tag: "signin-step",
  shadow: true,
})
export class SigninStep {
  @Element() el!: HTMLElement;
  @Prop() name!: "email" | "verification";
  @Prop() alwaysRender = false;

  @Method()
  async isActive(): Promise<boolean> {
    return authState.step === this.name || this.alwaysRender;
  }

  @Listen("click")
  handleClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.tagName === "BUTTON" && target.getAttribute("type") === "submit") {
      event.preventDefault();
      this.handleSubmit(event);
    }
  }

  @Listen("keydown")
  handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" && target.getAttribute("type") !== "textarea") {
        event.preventDefault();
        this.handleSubmit(event);
      }
    }
  }

  private handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (authState.loading) return;

    const authInstance = await Auth.getInstance();
    if (!authInstance) {
      console.error("Auth service not initialized");
      return;
    }

    if (authState.step === "email") {
      await authInstance.helpers.createSignIn(authState.email);
    } else if (authState.step === "verification") {
      await authInstance.helpers.authenticateWithPassword(authState.password);
    }
  };

  render() {
    let shouldRender = false;

    if (this.name === "email") {
      shouldRender = authState.step === "email";
    } else if (this.name === "verification") {
      shouldRender = authState.step === "verification" || authState.step === "magic-code";
    }

    if (!shouldRender) {
      return null;
    }

    return (
      <Host>
        <form onSubmit={this.handleSubmit}>
          <slot />
        </form>
      </Host>
    );
  }
}
