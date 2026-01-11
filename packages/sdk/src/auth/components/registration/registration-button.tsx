import { Component, Host, h, Prop, Element } from "@stencil/core";
import { authState, authStore } from "../../store/auth-store";
import { unidyState } from "../../../shared/store/unidy-store";
import { t } from "../../../i18n";

@Component({
  tag: "u-registration-button",
  shadow: false,
})
export class RegistrationButton {
  @Element() el!: HTMLElement;

  @Prop() for!: "email";
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() redirectUri: string = window.location.href;

  private getButtonText() {
    return t("buttons.registration", { defaultValue: "Register New Account" });
  }

  private shouldRender(): boolean {
    if (authState.errors.email === "account_not_found") {
      authStore.setStep("registration");
      return this.for === "email";
    }

    return false;
  }

  private getAuthUrl(): string {
    const baseUrl = unidyState.baseUrl;
    const redirectUri = this.redirectUri ? encodeURIComponent(this.redirectUri) : baseUrl;
    const encodedEmail = encodeURIComponent(authState.email);

    return `${baseUrl}/logins?email=${encodedEmail}&sdk_redirect_uri=${redirectUri}`;
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    if (authState.errors.email === "account_not_found" && authState.step === "registration") {
      window.location.href = this.getAuthUrl();
    }
  };

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    return (
      <Host>
        <slot name="registration-content" />
        <button type="submit" class={this.componentClassName} onClick={this.handleClick} aria-live="polite">
          {this.getButtonText()}
        </button>
      </Host>
    );
  }
}
