import { Component, h, Prop, Element } from "@stencil/core";
import { authState, authStore } from "../../../store/auth-store";
import { getParentSigninStep } from "../helpers";

@Component({
  tag: "password-field",
  shadow: false,
})
export class PasswordField {
  @Element() el!: HTMLElement;

  @Prop() placeholder = "Enter your password";
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    authStore.setPassword(target.value);
  };

  private handleSubmit = async (event: Event) => {
    event.preventDefault();

    (await getParentSigninStep(this.el))?.submit();
  };

  render() {
    if (authState.step !== "verification") {
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
        />
      </form>
    );
  }
}
