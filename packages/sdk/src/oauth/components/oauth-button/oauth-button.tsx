import { Component, Element, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../logger";
import { hasSlotContent, renderButtonContent } from "../../../shared/component-utils";
import { authState } from "../../../auth/store/auth-store";
import { getOAuthProvider, type OAuthProviderElement } from "../context";
import { oauthState } from "../../store/oauth-store";

export type OAuthButtonAction = "connect" | "submit" | "cancel";

@Component({
  tag: "u-oauth-button",
  shadow: false,
})
export class OAuthButton extends UnidyComponent {
  @Element() el!: HTMLElement;

  /**
   * The action this button performs.
   * - "connect": Start the OAuth flow (default)
   * - "submit": Submit the consent form
   * - "cancel": Cancel the consent flow
   */
  @Prop() action: OAuthButtonAction = "connect";

  /**
   * Custom CSS class name(s) to apply to the button element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private hasSlot = false;
  private provider: OAuthProviderElement | null = null;

  componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
    this.provider = getOAuthProvider(this.el);

    if (!this.provider) {
      this.logger.warn("Must be used inside a u-oauth-provider");
    }
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    if (!this.provider) {
      this.logger.error("No oauth-provider found");
      return;
    }

    switch (this.action) {
      case "connect":
        await this.provider.connect();
        break;
      case "submit":
        await this.provider.submit();
        break;
      case "cancel":
        await this.provider.cancel();
        break;
    }
  };

  private isDisabled(): boolean {
    if (!this.provider) return true;

    switch (this.action) {
      case "connect":
        return !authState.authenticated || oauthState.loading;
      case "submit":
        return oauthState.loading || !this.allFieldsFilled();
      case "cancel":
        return false;
      default:
        return false;
    }
  }

  private allFieldsFilled(): boolean {
    if (oauthState.missingFields.length === 0) return true;

    return oauthState.missingFields.every((field) => {
      const value = oauthState.fieldValues[field];
      return value !== undefined && value !== null && value !== "";
    });
  }

  private getDefaultLabel(): string {
    switch (this.action) {
      case "connect":
        return t("buttons.connect");
      case "submit":
        return t("buttons.confirm");
      case "cancel":
        return t("buttons.cancel");
      default:
        return "";
    }
  }

  private getButtonType(): "button" | "submit" {
    return this.action === "submit" ? "submit" : "button";
  }

  private showSpinner(): boolean {
    return (this.action === "connect" || this.action === "submit") && oauthState.loading;
  }

  render() {
    return (
      <button
        type={this.getButtonType()}
        disabled={this.isDisabled()}
        class={this.componentClassName}
        onClick={this.handleClick}
        aria-live="polite"
      >
        {renderButtonContent(this.hasSlot, this.showSpinner(), this.getDefaultLabel())}
      </button>
    );
  }
}
