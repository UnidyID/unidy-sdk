import { getUnidyClient } from "../api";
import { unidyState } from "../shared/store/unidy-store";
import { Auth } from "../auth/auth";
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
} from "./store/oauth-store";
import type { OAuthApplication, CheckConsentWithErrorResponse } from "./api/oauth";

export interface OAuthCallbacks {
  onSuccess: (data: { token: string; application: OAuthApplication; redirectUrl: string }) => void;
  onError: (data: { error: string; errorIdentifier: string }) => void;
  onCancel: () => void;
}

export interface OAuthConfig {
  clientId: string;
  scopes?: string;
  redirectUri?: string;
  newtab?: boolean;
  autoRedirect?: boolean;
}

export class OAuthHelper {
  private callbacks: OAuthCallbacks;
  private config: OAuthConfig;

  constructor(config: OAuthConfig, callbacks: OAuthCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  updateConfig(config: Partial<OAuthConfig>) {
    this.config = { ...this.config, ...config };

    if (config.clientId !== undefined) {
      setOAuthClientId(config.clientId);
    }
    if (config.scopes !== undefined || config.redirectUri !== undefined || config.newtab !== undefined) {
      setOAuthOptions({
        scopes: config.scopes ? config.scopes.split(",").map((s) => s.trim()) : oauthState.scopes,
        redirectUri: config.redirectUri ?? oauthState.redirectUri,
        newtab: config.newtab ?? oauthState.newtab,
      });
    }
  }

  initialize() {
    setOAuthClientId(this.config.clientId);
    setOAuthOptions({
      scopes: this.config.scopes ? this.config.scopes.split(",").map((s) => s.trim()) : null,
      redirectUri: this.config.redirectUri ?? null,
      newtab: this.config.newtab ?? false,
    });
  }

  cleanup() {
    resetOAuthState();
  }

  async connect(): Promise<void> {
    if (!this.config.clientId) {
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

      const connectResult = await client.oauth.connect(this.config.clientId, {
        scopes: oauthState.scopes ?? undefined,
        redirect_uri: oauthState.redirectUri ?? undefined,
      });

      const [error, result] = connectResult;

      if (error === null) {
        const tokenResult = result as { token: string };
        await this.handleSuccess(tokenResult.token);
        return;
      }

      if (error === "consent_not_granted" || error === "missing_required_fields") {
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
      console.error("[OAuthHelper] Error during connect:", err);
      this.handleError("unknown_error", "An unexpected error occurred");
    } finally {
      setOAuthLoading(false);
    }
  }

  async submit(): Promise<void> {
    if (!oauthState.clientId) {
      this.handleError("client_id_required", "client-id is required");
      return;
    }

    setOAuthStep("submitting");
    setOAuthLoading(true);

    try {
      const client = getUnidyClient();

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

      const grantResult = await client.oauth.grantConsent(oauthState.clientId, {
        scopes: oauthState.scopes ?? undefined,
        redirect_uri: oauthState.redirectUri ?? undefined,
      });

      const [grantError, grantData] = grantResult;

      if (grantError === null) {
        const tokenResult = grantData as { token: string };
        await this.handleSuccess(tokenResult.token);
      } else if (grantError === "missing_required_fields") {
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
      console.error("[OAuthHelper] Error during submit:", err);
      this.handleError("unknown_error", "An unexpected error occurred");
    } finally {
      setOAuthLoading(false);
    }
  }

  cancel(): void {
    resetOAuthState();
    setOAuthClientId(this.config.clientId);
    setOAuthOptions({
      scopes: this.config.scopes ? this.config.scopes.split(",").map((s) => s.trim()) : null,
      redirectUri: this.config.redirectUri ?? null,
      newtab: this.config.newtab ?? false,
    });
    this.callbacks.onCancel();
  }

  private async handleSuccess(token: string): Promise<void> {
    setOAuthToken(token);
    setOAuthStep("redirecting");

    const redirectUrl = new URL("/one_time_login", unidyState.baseUrl);
    redirectUrl.searchParams.set("token", token);
    if (oauthState.redirectUri) {
      redirectUrl.searchParams.set("redirect_uri", oauthState.redirectUri);
    }

    const finalUrl = redirectUrl.toString();

    this.callbacks.onSuccess({
      token,
      application: oauthState.application!,
      redirectUrl: finalUrl,
    });

    if (this.config.autoRedirect !== false) {
      if (oauthState.newtab) {
        window.open(finalUrl, "_blank");
      } else {
        window.location.href = finalUrl;
      }
    }
  }

  private handleError(errorIdentifier: string, message: string): void {
    console.error(`[OAuthHelper] ${errorIdentifier}: ${message}`);
    setOAuthError(message);
    this.callbacks.onError({ error: message, errorIdentifier });
  }
}
