import { Component, h, Prop, Element } from "@stencil/core";
import { authStore, authState } from "../../../store/auth-store";
import { getParentSigninStep } from "../helpers";

@Component({
  tag: "email-field",
  shadow: false,
})
export class EmailField {
  @Element() el!: HTMLElement;

  @Prop() placeholder = "Enter your email";
  @Prop({ attribute: "class-name" }) componentClassName = "";

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
    if (authState.step === "verification") {
      return <input id="email" type="email" value={authState.email} placeholder="Email" class={this.componentClassName} disabled={true} />;
    }

    return (
      <form onSubmit={this.handleSubmit}>
        <input
          id="email"
          type="email"
          value={authState.email}
          autocomplete="email"
          placeholder={this.placeholder}
          disabled={authState.loading}
          class={this.componentClassName}
          onInput={this.handleInput}
        />
      </form>
    );
  }
}
