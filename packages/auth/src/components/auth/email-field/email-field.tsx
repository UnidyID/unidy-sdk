import { Component, h, Prop } from "@stencil/core";
import { authStore, authState } from "../../../store/auth-store";

@Component({
  tag: "email-field",
  shadow: false,
})
export class EmailField {
  @Prop() placeholder = "Enter your email";
  @Prop() className = "";

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    authStore.setEmail(target.value);
  };

  render() {
    if (authState.step === "verification") {
      return (
        <unidy-raw-field
          name="email"
          type="email"
          value={authState.email}
          placeholder="Email"
          customStyle={this.className}
          disabled={true}
        />
      );
    }

    return (
      <unidy-raw-field
        name="email"
        type="email"
        value={authState.email}
        placeholder={this.placeholder}
        disabled={authState.loading}
        customStyle={this.className}
        onInput={this.handleInput}
      />
    );
  }
}
