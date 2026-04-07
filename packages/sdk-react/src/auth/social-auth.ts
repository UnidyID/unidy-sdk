/**
 * Build the OAuth redirect URL for a social auth provider.
 * Matches the URL pattern used by the Stencil SDK's social-login-button component.
 */
export function getSocialAuthUrl(baseUrl: string, provider: string, redirectUri: string): string {
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  return `${baseUrl}/api/sdk/v1/sign_ins/auth/omniauth/${provider}?sdk_redirect_uri=${encodedRedirectUri}`;
}

export interface SocialAuthCallbackResult {
  signInId: string;
  idToken: string;
  refreshToken: string;
}

/**
 * Parse social auth callback parameters from the current URL.
 * After a social auth redirect, the URL will contain:
 * - `sid`: sign-in ID
 * - `auth_payload`: base64-encoded JSON with id_token and refresh_token
 * - `error`: error identifier (e.g. "brand_connection_required", "missing_required_fields")
 * - `fields`: JSON-encoded missing fields (when error is "missing_required_fields")
 *
 * Returns null if the URL does not contain social auth callback parameters.
 */
export function parseSocialAuthCallback(search: string): {
  result?: SocialAuthCallbackResult;
  error?: string;
  fields?: Record<string, unknown>;
} | null {
  const params = new URLSearchParams(search);

  const error = params.get("error");
  const sid = params.get("sid");

  // Not a social auth redirect if neither error nor sid present
  if (!error && !sid) {
    return null;
  }

  // Error case
  if (error) {
    const fields = params.get("fields");
    let parsedFields: Record<string, unknown> | undefined;
    if (fields) {
      try {
        parsedFields = JSON.parse(fields);
      } catch {
        // ignore malformed fields
      }
    }
    return { error, fields: parsedFields };
  }

  // Success case: decode auth_payload
  const authPayload = params.get("auth_payload");
  if (!sid || !authPayload) {
    return null;
  }

  try {
    const decoded = JSON.parse(atob(authPayload));
    const idToken = decoded.id_token;
    const refreshToken = decoded.refresh_token;

    if (!idToken) {
      return { error: "missing_id_token_in_payload" };
    }

    return {
      result: {
        signInId: sid,
        idToken,
        refreshToken,
      },
    };
  } catch {
    return { error: "invalid_auth_payload" };
  }
}

/**
 * Remove social auth callback parameters from the URL without triggering navigation.
 */
export function cleanSocialAuthParams(): void {
  const url = new URL(window.location.href);
  const paramsToRemove = ["sid", "auth_payload", "error", "fields"];

  let changed = false;
  for (const param of paramsToRemove) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState({}, "", url.toString());
  }
}
