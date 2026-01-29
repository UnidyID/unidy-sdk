import { Component, Element, Event, type EventEmitter, h, Host, Method, Prop, Watch } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { unidyState } from "../../../shared/store/unidy-store";
import { Auth } from "../../../auth/auth";
import {
  oauthState,
  resetOAuthState,
  setOAuthClientId,
  setOAuthOptions,
  setOAuthStep,
  setOAuthLoading,
  setOAuthConsentData,
  setOAuthToken,
  setOAuthError,
  getOAuthFieldUpdates,
} from "../../store/oauth-store";
import type { OAuthApplication, CheckConsentWithErrorResponse } from "../../api/oauth";

export interface OAuthSuccessEvent {
  token: string;
  application: OAuthApplication;
  redirectUrl: string;
}

export interface OAuthErrorEvent {
  error: string;
  errorIdentifier?: string;
}

@Component({
  tag: "u-oauth-provider",
  shadow: false,
})
export class OAuthProvider {
  @Element() el!: HTMLElement;

  /**
   * The OAuth application client ID (uid).
   */
  @Prop({ attribute: "client-id" }) clientId!: string;

  /**
   * Custom OAuth scopes to request, comma-separated.
   * If not provided, uses the application's default scopes.
   */
  @Prop() scopes?: string;

  /**
   * Custom redirect URI for the OAuth flow.
   * Must match one of the application's allowed redirect URIs.
   */
  @Prop({ attribute: "redirect-uri" }) redirectUri?: string;

  /**
   * If true, opens the redirect URL in a new tab.
   */
  @Prop() newtab = false;

  /**
   * If true, automatically redirect after successful consent.
   * If false, emits the success event but doesn't redirect.
   */
  @Prop({ attribute: "auto-redirect" }) autoRedirect = true;

  /**
   * Emitted when consent is successfully granted.
   */
  @Event() oauthSuccess!: EventEmitter<OAuthSuccessEvent>;

  /**
   * Emitted when an error occurs during the OAuth flow.
   */
  @Event() oauthError!: EventEmitter<OAuthErrorEvent>;

  /**
   * Emitted when the user cancels the consent flow.
   */
  @Event() oauthCancel!: EventEmitter<void>;

  @Watch("clientId")
  watchClientId(newValue: string) {
    setOAuthClientId(newValue);
  }

  @Watch("scopes")
  watchScopes(newValue: string | undefined) {
    const scopesArray = newValue ? newValue.split(",").map((s) => s.trim()) : null;
    setOAuthOptions({ scopes: scopesArray });
  }

  @Watch("redirectUri")
  watchRedirectUri(newValue: string | undefined) {
    setOAuthOptions({ redirectUri: newValue ?? null });
  }

  @Watch("newtab")
  watchNewtab(newValue: boolean) {
    setOAuthOptions({ newtab: newValue });
  }

  componentWillLoad() {
    // Initialize store with props
    setOAuthClientId(this.clientId);
    setOAuthOptions({
      scopes: this.scopes ? this.scopes.split(",").map((s) => s.trim()) : null,
      redirectUri: this.redirectUri ?? null,
      newtab: this.newtab,
    });
  }

  disconnectedCallback() {
    resetOAuthState();
  }

  /**
   * Start the OAuth connect flow.
   * Called by oauth-button or can be called programmatically.
   */
  @Method()
  async connect(): Promise<void> {
    if (!this.clientId) {
      this.handleError("client_id_required", "client-id is required");
      return;
    }

    const auth = await Auth.getInstance();
    const isAuthenticated = await auth.isAuthenticated();

    if (!isAuthenticated) {
      this.handleError("not_authenticated", "User is not authenticated. Please log in first.");
      return;
    }

    setOAuthStep("loading");
    setOAuthLoading(true);

    try {
      const client = getUnidyClient();

      // Try to connect directly first
      const connectResult = await client.oauth.connect(this.clientId, {
        scopes: oauthState.scopes ?? undefined,
        redirect_uri: oauthState.redirectUri ?? undefined,
      });

      const [error, result] = connectResult;

      if (error === null) {
        // Success! User already has consent or app is auto_approve
        const tokenResult = result as { token: string };
        await this.handleSuccess(tokenResult.token);
        return;
      }

      // Handle different error cases
      if (error === "consent_not_granted" || error === "missing_required_fields") {
        // Need to show consent modal
        const consentData = result as CheckConsentWithErrorResponse;
        setOAuthConsentData({
          hasConsent: consentData.has_consent,
          application: consentData.application,
          requiredFields: consentData.required_fields,
          missingFields: consentData.missing_fields,
        });
        setOAuthStep("consent");
      } else if (error === "application_not_found") {
        this.handleError("application_not_found", "OAuth application not found");
      } else if (error === "connection_failed") {
        this.handleError("connection_failed", "Network error. Please try again.");
      } else {
        this.handleError("unknown_error", "An unexpected error occurred");
      }
    } catch (err) {
      console.error("[u-oauth-provider] Error during connect:", err);
      this.handleError("unknown_error", "An unexpected error occurred");
    } finally {
      setOAuthLoading(false);
    }
  }

  /**
   * Submit the consent form (grant consent with optional field updates).
   * Called by oauth-submit.
   */
  @Method()
  async submit(): Promise<void> {
    if (!oauthState.clientId) {
      this.handleError("client_id_required", "client-id is required");
      return;
    }

    setOAuthStep("submitting");
    setOAuthLoading(true);

    try {
      const client = getUnidyClient();

      // If there are field values to update, update first
      const fieldUpdates = getOAuthFieldUpdates();
      if (fieldUpdates) {
        const [updateError] = await client.oauth.updateConsent(oauthState.clientId, fieldUpdates);

        if (updateError) {
          if (updateError === "invalid_user_updates") {
            setOAuthError("Invalid field values provided");
            setOAuthStep("consent");
            return;
          }
          this.handleError(updateError, "Failed to update user data");
          return;
        }
      }

      // Now grant consent
      const grantResult = await client.oauth.grantConsent(oauthState.clientId, {
        scopes: oauthState.scopes ?? undefined,
        redirect_uri: oauthState.redirectUri ?? undefined,
      });

      const [grantError, grantData] = grantResult;

      if (grantError === null) {
        const tokenResult = grantData as { token: string };
        await this.handleSuccess(tokenResult.token);
      } else if (grantError === "missing_required_fields") {
        // Still missing fields - update the state
        const checkResult = await client.oauth.checkConsent(oauthState.clientId);
        const [checkError, checkData] = checkResult;
        if (checkError === null && checkData) {
          const consentData = checkData as {
            has_consent: boolean;
            application: OAuthApplication;
            required_fields: string[];
            missing_fields: string[];
          };
          setOAuthConsentData({
            hasConsent: consentData.has_consent,
            application: consentData.application,
            requiredFields: consentData.required_fields,
            missingFields: consentData.missing_fields,
          });
        }
        setOAuthError("Please fill in all required fields");
        setOAuthStep("consent");
      } else {
        this.handleError(grantError || "unknown_error", "Failed to grant consent");
      }
    } catch (err) {
      console.error("[u-oauth-provider] Error during submit:", err);
      this.handleError("unknown_error", "An unexpected error occurred");
    } finally {
      setOAuthLoading(false);
    }
  }

  /**
   * Cancel the consent flow.
   * Called by oauth-cancel or close button.
   */
  @Method()
  async cancel(): Promise<void> {
    resetOAuthState();
    setOAuthClientId(this.clientId);
    setOAuthOptions({
      scopes: this.scopes ? this.scopes.split(",").map((s) => s.trim()) : null,
      redirectUri: this.redirectUri ?? null,
      newtab: this.newtab,
    });
    this.oauthCancel.emit();
  }

  private async handleSuccess(token: string): Promise<void> {
    setOAuthToken(token);
    setOAuthStep("redirecting");

    // Build redirect URL
    const redirectUrl = new URL("/one_time_login", unidyState.baseUrl);
    redirectUrl.searchParams.set("token", token);
    if (oauthState.redirectUri) {
      redirectUrl.searchParams.set("redirect_uri", oauthState.redirectUri);
    }

    const finalUrl = redirectUrl.toString();

    // Emit success event
    this.oauthSuccess.emit({
      token,
      application: oauthState.application!,
      redirectUrl: finalUrl,
    });

    // Auto-redirect if enabled
    if (this.autoRedirect) {
      if (oauthState.newtab) {
        window.open(finalUrl, "_blank");
      } else {
        window.location.href = finalUrl;
      }
    }
  }

  private handleError(errorIdentifier: string, message: string): void {
    console.error(`[u-oauth-provider] ${errorIdentifier}: ${message}`);
    setOAuthError(message);
    this.oauthError.emit({ error: message, errorIdentifier });
  }

  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
