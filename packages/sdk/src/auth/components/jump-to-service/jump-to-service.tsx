import { Component, Element, h, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { t } from "../../../i18n";
import { createAuthSubscription } from "../../../shared/utils/auth-subscription";
import { renderButtonContent } from "../../../shared/utils/button-content";
import { redirectWithToken } from "../../../shared/utils/redirect-with-token";
import { Auth } from "../../auth";
import { authState } from "../../store/auth-store";

@Component({
  tag: "u-jump-to-service",
  shadow: false,
})
export class JumpToService {
  @Element() el!: HTMLElement;

  /**
   * The OAuth Application ID (service ID) to jump to.
   * @example "2"
   */
  @Prop({ attribute: "service-id" }) serviceId!: string;

  /**
   * If true, opens the URL in a new tab. Defaults to false.
   */
  @Prop() newtab = false;

  /**
   * Custom CSS class name(s) to apply to the button element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /**
   * Optional redirect URI for the OAuth flow.
   * Must match one of the application's allowed redirect URIs.
   */
  @Prop({ attribute: "redirect-uri" }) redirectUri?: string;

  /**
   * Comma-separated list of OAuth scopes to request.
   * Defaults to ["openid"] if not provided.
   * @example "openid,profile"
   */
  @Prop() scopes?: string;

  /**
   * If true, skips the OAuth authorization step (if already authorized once). Defaults to false.
   */
  @Prop({ attribute: "skip-oauth-authorization" }) skipOauthAuthorization = false;

  @State() loading = false;

  private unsubscribe?: () => void;

  connectedCallback() {
    this.unsubscribe = createAuthSubscription(this);
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    if (!this.serviceId) {
      console.error("[u-jump-to-service] service-id is required");
      return;
    }

    const auth = await Auth.getInstance();
    if (!(await auth.isAuthenticated())) {
      console.error("[u-jump-to-service] User is not authenticated. Please log in first.");
      return;
    }

    const userData = await auth.userData();
    if (!userData?.email) {
      console.error("Failed to get user email from authentication token");
      return;
    }

    this.loading = true;

    try {
      const client = getUnidyClient();
      const scopesArray = this.scopes?.split(",").map((s) => s.trim());

      const [error, token] = await client.auth.jumpToService(this.serviceId, {
        email: userData.email,
        redirect_uri: this.redirectUri,
        scopes: scopesArray,
        skip_oauth_authorization: this.skipOauthAuthorization,
      });

      if (error) {
        console.error("Failed to get jump token:", error);
        return;
      }

      redirectWithToken({
        // @ts-expect-error - TOKEN IS A STRING, BUT we need to enable strict for it to work
        token,
        newTab: this.newtab,
        extraParams: this.redirectUri ? { redirect_uri: this.redirectUri } : undefined,
      });
    } catch (error) {
      console.error("Error jumping to service:", error);
    } finally {
      this.loading = false;
    }
  };

  private isDisabled(): boolean {
    return !authState.authenticated || this.loading || !this.serviceId;
  }

  render() {
    const hasSlot = this.el.childNodes.length > 0;
    return (
      <button type="button" disabled={this.isDisabled()} class={this.componentClassName} onClick={this.handleClick} aria-live="polite">
        {renderButtonContent(hasSlot, this.loading, t("buttons.jump_to_service"))}
      </button>
    );
  }
}
