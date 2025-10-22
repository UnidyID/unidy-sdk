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
        <unidy-raw-field
          field="email"
          type="email"
          value={authState.email}
          placeholder="Email"
          customStyle={this.customStyle}
          disabled={true}
        />
      );
    }

    return (
      <unidy-raw-field
        field="email"
        type="email"
        store="none"
        value={authState.email}
        placeholder={this.placeholder}
        disabled={authState.loading}
        customStyle={this.customStyle}
        onInput={this.handleInput}
      />
    );
  }
}
