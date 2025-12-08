import { Component, h, Prop, Element } from "@stencil/core";
import { t } from "../../../i18n";
import { authState, authStore } from "../../store/auth-store";
import { getParentSigninStep } from "../helpers";

@Component({
  tag: "u-password-field",
  shadow: false,
})
export class PasswordField {
  @Element() el!: HTMLElement;

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
    if (authState.step !== "verification") {
      return null;
    }

    if (authState.availableLoginOptions && !authState.availableLoginOptions.password) {
      return null;
    }

    const placeholder = t("auth.password.placeholder", { defaultValue: "Enter your password" });

    return (
      <form onSubmit={this.handleSubmit}>
        <input
          name="password"
          type="password"
          value={authState.password}
          autocomplete="current-password"
          placeholder={placeholder}
          disabled={authState.loading}
          class={this.componentClassName}
          onInput={this.handleInput}
          aria-label={this.ariaLabel}
        />
      </form>
    );
  }
}
