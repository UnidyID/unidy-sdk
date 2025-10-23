import { Component, h, Prop } from "@stencil/core";
import { authStore, authState } from "../../../store/auth-store";

@Component({
  tag: "email-field",
  shadow: false,
})
export class EmailField {
  @Prop() placeholder = "Enter your email";
  @Prop() customStyle = "";

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    authStore.setEmail(target.value);
  };

  render() {
    if (authState.step === "verification") {
      return (
        <input
          id="email"
          type="email"
          value={authState.email}
          placeholder="Email"
          class={this.customStyle}
          disabled={true}
        />
      );
    }

    return (
      <input
        id="email"
        type="email"
        value={authState.email}
        autocomplete="email"
        placeholder={this.placeholder}
        disabled={authState.loading}
        class={this.customStyle}
        onInput={this.handleInput}
      />
    );
  }
}
