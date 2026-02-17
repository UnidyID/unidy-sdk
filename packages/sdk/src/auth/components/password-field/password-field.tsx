import { Component, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { findParentSigninStep } from "../../../shared/context-utils";
import { authState, authStore } from "../../store/auth-store";

export type PasswordFieldFor = "login" | "new-password" | "password-confirmation";

@Component({
  tag: "u-password-field",
  shadow: false,
})
export class PasswordField extends UnidyComponent() {
  /** The purpose of this password field: login, new-password, or password-confirmation. */
  @Prop() for: PasswordFieldFor = "login";
  /** CSS classes to apply to the input element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";
  /** ARIA label for accessibility. Defaults based on the 'for' prop if not provided. */
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

    (await findParentSigninStep(this.element))?.submit();
  };

  private shouldRender(): boolean {
    switch (this.for) {
      case "login":
        if (authState.step === "single-login") return true;
        if (authState.step === "verification" && authState.availableLoginOptions?.password) {
          return true;
        }
        return false;
      case "new-password":
      case "password-confirmation":
        return authState.step === "reset-password";
    }
  }

  render() {
    if (!this.shouldRender()) {
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
