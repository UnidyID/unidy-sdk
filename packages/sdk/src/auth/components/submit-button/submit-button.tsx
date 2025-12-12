import { Component, h, Prop, Element } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { getParentSigninStep } from "../helpers";
import { t } from "../../../i18n";

@Component({
  tag: "u-auth-submit-button",
  shadow: false,
})
export class SubmitButton {
  @Element() el!: HTMLElement;

  @Prop() for!: "email" | "single-login" | "password" | "resetPassword";
  @Prop() disabled = false;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private getButtonText() {
    switch (authState.step) {
      case "email":
        return t("buttons.continue");
      case "verification":
        if (this.for === "password") {
          return t("auth.password.button_text", { defaultValue: "Sign In with Password" });
        }
        return t("buttons.submit");
      case "reset-password":
        if (this.for === "resetPassword") {
          return t("auth.resetPassword.button_text_set", { defaultValue: "Set Password" });
        }

        return t("buttons.submit");
      case "single-login":
        return t("auth.single-login.button_text", { defaultValue: "Sign in" });
      default:
        return t("buttons.submit");
    }
  }

  private shouldRender(): boolean {
    if (!authState.availableLoginOptions?.password && this.for === "password") {
      return false;
    }

    if (authState.step === "email") {
      return this.for === "email";
    }
    if (authState.step === "single-login") {
      return this.for === "single-login";
    }
    if (authState.step === "verification") {
      return this.for === "password" && authState.magicCodeStep !== "sent";
    }
    if (authState.step === "reset-password") {
      return this.for === "resetPassword";
    }

    return false;
  }

  private isDisabled(): boolean {
    if (this.disabled || authState.loading) return true;

    if (authState.step === "email" && this.for === "email") {
      return authState.email === "";
    }

    if (authState.step === "single-login" && this.for === "single-login") {
      return authState.password === "" || authState.email === "";
    }

    if (authState.step === "verification" && this.for === "password") {
      return authState.password === "";
    }

    if (authState.step === "reset-password" && this.for === "resetPassword") {
      return !authState.resetPassword.newPassword || !authState.resetPassword.passwordConfirmation;
    }

    if (authState.step === "single-login") {
      return authState.password === "" || authState.email === "";
    }

    return false;
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    await getParentSigninStep(this.el)?.submit();
  };

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    const loadingContent = (
      <div class="flex items-center gap-1">
        <u-spinner /> {t("loading")}
      </div>
    );

    return (
      <button
        type="submit"
        disabled={this.isDisabled()}
        class={`${this.componentClassName} flex justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={this.handleClick}
        aria-live="polite"
      >
        {authState.loading && authState.magicCodeStep !== "requested" && authState.step !== "reset-password"
          ? loadingContent
          : this.getButtonText()}
      </button>
    );
  }
}
