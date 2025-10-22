import { Component, h, Prop } from "@stencil/core";
import { authState, authStore } from "../../../store/auth-store";

@Component({
  tag: "password-field",
  shadow: false,
})
export class PasswordField {
  @Prop() placeholder = "Enter your password";
  @Prop() customStyle = "";

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    authStore.setPassword(target.value);
  };

  render() {
    if (authState.step !== "verification" || authState.magicCodeSent) {
      return null;
    }

    return (
      <input
        name="password"
        type="password"
        value={authState.password}
        placeholder={this.placeholder}
        disabled={authState.loading}
        class={this.customStyle}
        onInput={this.handleInput}
      />
    );
  }
}
