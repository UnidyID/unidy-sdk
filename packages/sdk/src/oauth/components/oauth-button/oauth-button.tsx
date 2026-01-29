import { Component, Element, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { hasSlotContent, renderButtonContent } from "../../../shared/component-utils";
import { authState, onChange as authOnChange } from "../../../auth/store/auth-store";
import { getOAuthProvider, type OAuthProviderElement } from "../context";
import { oauthState, onChange } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-button",
  shadow: false,
})
export class OAuthButton {
  @Element() el!: HTMLElement;

  /**
   * Custom CSS class name(s) to apply to the button element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() private loading = false;

  private hasSlot = false;
  private provider: OAuthProviderElement | null = null;
  private unsubscribers: Array<() => void> = [];

  componentWillLoad() {
    this.hasSlot = hasSlotContent(this.el);
    this.provider = getOAuthProvider(this.el);
    this.loading = oauthState.loading;

    if (!this.provider) {
      console.warn("[u-oauth-button] Must be used inside a u-oauth-provider");
      return;
    }

    this.unsubscribers.push(
      onChange("loading", (loading) => {
        this.loading = loading;
      })
    );

    this.unsubscribers.push(authOnChange("authenticated", () => {}));
  }

  disconnectedCallback() {
    this.unsubscribers.forEach((unsub) => unsub());
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    if (!this.provider) {
      console.error("[u-oauth-button] No oauth-provider found");
      return;
    }

    await this.provider.connect();
  };

  private isDisabled(): boolean {
    return !authState.authenticated || this.loading || !this.provider;
  }

  render() {
    return (
      <button
        type="button"
        disabled={this.isDisabled()}
        class={this.componentClassName}
        onClick={this.handleClick}
        aria-live="polite"
      >
        {renderButtonContent(this.hasSlot, this.loading, t("buttons.connect"))}
      </button>
    );
  }
}
