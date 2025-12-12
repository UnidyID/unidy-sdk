import { Component, h, Prop, Element } from "@stencil/core";
import { t } from "../../../i18n";
import { authState, authStore } from "../../store/auth-store";
import { getParentSigninStep } from "../helpers";

export type PasswordFieldFor = "login" | "new-password" | "password-confirmation";

@Component({
  tag: "u-password-field",
  shadow: false,
})
export class PasswordField {
  @Element() el!: HTMLElement;

  @Prop() for: PasswordFieldFor = "login";
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() ariaLabel = "";

  private getAriaLabel(): string {
    if (this.ariaLabel) return this.ariaLabel;

    switch (this.for) {
      case "login":
        return "Password";
      case "new-password":
        return "New Password";
      case "password-confirmation":
        return "Password Confirmation";
    }
  }

  private getValue(): string {
    switch (this.for) {
      case "login":
        return authState.password;
      case "new-password":
        return authState.resetPassword.newPassword;
      case "password-confirmation":
        return authState.resetPassword.passwordConfirmation;
    }
  }

  private getAutocomplete(): string {
    switch (this.for) {
      case "login":
        return "current-password";
      case "new-password":
      case "password-confirmation":
        return "new-password";
    }
  }

  private getInputName(): string {
    switch (this.for) {
      case "login":
        return "password";
      case "new-password":
        return "new-password";
      case "password-confirmation":
        return "confirm-password";
    }
  }

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;

    switch (this.for) {
      case "login":
        authStore.setPassword(target.value);
        break;
      case "new-password":
        authStore.setNewPassword(target.value);
        authStore.clearFieldError("resetPassword");
        authStore.clearFieldError("password");
        break;
      case "password-confirmation":
        authStore.setConfirmPassword(target.value);
        authStore.clearFieldError("resetPassword");
        authStore.clearFieldError("password");
        break;
    }
  };

  private handleSubmit = async (event: Event) => {
    event.preventDefault();

    (await getParentSigninStep(this.el))?.submit();
  };

  private shouldRender(): boolean {
    switch (this.for) {
      case "login":
        return (authState.step === "verification" && authState.availableLoginOptions?.password) || authState.step === "single-login";
      case "new-password":
      case "password-confirmation":
        return authState.step === "reset-password";
    }
  }

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    if (authState.availableLoginOptions && !authState.availableLoginOptions.password && authState.step !== "single-login") {
      return null;
    }

    const key = this.for === "password-confirmation" ? "auth.password.confirmation.placeholder" : "auth.password.placeholder";
    const placeholder = t(key, { defaultValue: "Enter your password" });

    return (
      <form onSubmit={this.handleSubmit}>
        <input
          name={this.getInputName()}
          type="password"
          value={this.getValue()}
          autocomplete={this.getAutocomplete()}
          placeholder={placeholder}
          disabled={authState.loading}
          class={this.componentClassName}
          onInput={this.handleInput}
          aria-label={this.getAriaLabel()}
        />
      </form>
    );
  }
}
