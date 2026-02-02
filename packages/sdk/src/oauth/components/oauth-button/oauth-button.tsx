import { Component, h, Prop } from "@stencil/core";
import { authState } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { state as profileState } from "../../../profile/store/profile-store";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotContent } from "../../../shared/base/has-slot-content";
import { slotFallbackText } from "../../../shared/component-utils";
import { oauthState } from "../../store/oauth-store";
import { getOAuthProvider, type OAuthProviderElement } from "../context";

export type OAuthButtonAction = "connect" | "submit" | "cancel";

@Component({
  tag: "u-oauth-button",
  shadow: false,
})
export class OAuthButton extends UnidyComponent(HasSlotContent) {
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

  private provider: OAuthProviderElement | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.provider = getOAuthProvider(this.element);

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

    return oauthState.missingFields.every((fieldName) => {
      let value: unknown;
      if (fieldName.startsWith("custom_attributes.")) {
        const attrName = fieldName.replace("custom_attributes.", "");
        value = profileState.data.custom_attributes?.[attrName]?.value;
      } else {
        value = profileState.data[fieldName]?.value;
      }
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
        {slotFallbackText(this.getDefaultLabel(), { hasSlot: this.hasSlot, loading: this.showSpinner() })}
      </button>
    );
  }
}
