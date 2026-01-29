/**
 * @fileoverview entry point for OAuth consent flow components
 *
 * This is the entry point for OAuth consent components. Use this file to export utilities,
 * constants or data structure that accompany your components.
 *
 * DO NOT use this file to export your components. Instead, use the recommended approaches
 * to consume components of this package as outlined in the `README.md`.
 */

// API types
export type {
  OAuthScope,
  OAuthApplication,
  CheckConsentResponse,
  OAuthTokenResponse,
  UpdateConsentRequest,
  GrantConsentRequest,
  ConnectRequest,
} from "./api/oauth";

export type { CheckConsentResult, UpdateConsentResult, GrantConsentResult, ConnectResult } from "./api/oauth";

// Store types and exports
export type { OAuthState, OAuthStep } from "./store/oauth-store";
export { oauthState, onChange as onOAuthChange, resetOAuthState } from "./store/oauth-store";

// Component event types
export type { OAuthSuccessEvent, OAuthErrorEvent } from "./components/oauth-provider/oauth-provider";
export type { OAuthButtonAction } from "./components/oauth-button/oauth-button";

// Helper
export { OAuthHelper } from "./helpers";
export type { OAuthCallbacks, OAuthConfig } from "./helpers";
