import { Component, h, Prop, State, forceUpdate, Element } from "@stencil/core";
import { Auth } from "../../auth";
import { authState, onChange } from "../../store/auth-store";
import { getUnidyClient } from "../../../api";
import { unidyState } from "../../../shared/store/unidy-store";
import { t } from "../../../i18n";

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

  // TODO: Figure out a way to share this across components
  private unsubscribe?: () => void;

  connectedCallback() {
    this.unsubscribe = onChange("authenticated", () => {
      forceUpdate(this);
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private handleClick = async (event: Event) => {
    event.preventDefault();

    if (!this.serviceId) {
      console.error("[u-jump-to-service] service-id is required");
      return;
    }

    const auth = await Auth.getInstance();
    const isAuthenticated = await auth.isAuthenticated();

    if (!isAuthenticated) {
      console.error("[u-jump-to-service] User is not authenticated. Please log in first.");
      return;
    }

    const userData = await auth.userData();
    if (!userData || !userData.email) {
      console.error("Failed to get user email from authentication token");
      return;
    }

    this.loading = true;

    try {
      const client = getUnidyClient();

      // Parse scopes if provided
      const scopesArray = this.scopes ? this.scopes.split(",").map((s) => s.trim()) : undefined;

      const [error, token] = await client.auth.jumpToService(this.serviceId, {
        email: userData.email,
        redirect_uri: this.redirectUri,
        scopes: scopesArray,
        skip_oauth_authorization: this.skipOauthAuthorization,
      });

      if (error) {
        console.error("Failed to get jump token:", error);
        this.loading = false;
        return;
      }

      const redirectUrl = new URL("/one_time_login", unidyState.baseUrl);
      // @ts-expect-error - TOKEN IS A STRING, BUT we need to enable strict for it to work
      redirectUrl.searchParams.set("token", token);
      if (this.redirectUri) {
        redirectUrl.searchParams.set("redirect_uri", this.redirectUri);
      }

      const finalUrl = redirectUrl.toString();

      if (this.newtab) {
        window.open(finalUrl, "_blank");
      } else {
        window.location.href = finalUrl;
      }
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
        {this.loading ? <u-spinner /> : hasSlot ? <slot /> : t("buttons.jump_to_service")}
      </button>
    );
  }
}
