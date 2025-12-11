import { Component, h, Prop, Element } from "@stencil/core";
import { authState, authStore } from "../../store/auth-store";
import { getParentSigninStep } from "../helpers";

@Component({
  tag: "u-password-field",
  shadow: false,
})
export class PasswordField {
  @Element() el!: HTMLElement;

  @Prop() placeholder = "Enter your password";
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() ariaLabel = "Password";

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    authStore.setPassword(target.value);
  };

  private handleSubmit = async (event: Event) => {
    event.preventDefault();

    (await getParentSigninStep(this.el))?.submit();
  };

  render() {
    if (authState.step !== "single-login" && authState.step !== "verification") {
      return null;
    }

    if (authState.availableLoginOptions && !authState.availableLoginOptions.password) {
      return null;
    }

    return (
      <form onSubmit={this.handleSubmit}>
        <input
          name="password"
          type="password"
          value={authState.password}
          autocomplete="current-password"
          placeholder={this.placeholder}
          disabled={authState.loading}
          class={this.componentClassName}
          onInput={this.handleInput}
          aria-label={this.ariaLabel}
        />
      </form>
    );
  }
}
