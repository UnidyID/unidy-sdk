import { Component, h, Prop, Element } from "@stencil/core";
import { authStore, authState } from "../../store/auth-store";
import { getParentSigninStep } from "../helpers";

@Component({
  tag: "u-email-field",
  shadow: false,
})
export class EmailField {
  @Element() el!: HTMLElement;

  @Prop() placeholder = "Enter your email";
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() ariaLabel = "Email";
  @Prop() disabled = false;

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    authStore.setEmail(target.value);
  };

  private handleSubmit = async (event: Event) => {
    event.preventDefault();

    if (authState.email === "") {
      return;
    }

    (await getParentSigninStep(this.el))?.submit();
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input
          id="email"
          type="email"
          value={authState.email}
          autocomplete="email"
          placeholder={this.placeholder}
          disabled={this.disabled || authState.loading || authState.step === "verification"}
          class={`${this.componentClassName} disabled:opacity-40 disabled:cursor-not-allowed`}
          onInput={this.handleInput}
          aria-label={this.ariaLabel}
        />
      </form>
    );
  }
}
