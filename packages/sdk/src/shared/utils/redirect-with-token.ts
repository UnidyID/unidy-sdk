import { unidyState } from "../store/unidy-store";

export interface RedirectWithTokenOptions {
  /** The authentication token */
  token: string;
  /** If true, opens in a new tab. Defaults to false. */
  newTab?: boolean;
  /** Additional query parameters to add to the redirect URL */
  extraParams?: Record<string, string>;
}

/**
 * Redirects to Unidy's one_time_login endpoint with a token.
 *
 * @example
 * ```ts
 * redirectWithToken({
 *   token: "abc123",
 *   newTab: true,
 *   extraParams: { redirect_uri: "https://example.com" }
 * });
 * ```
 */
export function redirectWithToken({ token, newTab = false, extraParams }: RedirectWithTokenOptions): void {
  const redirectUrl = new URL("/one_time_login", unidyState.baseUrl);
  redirectUrl.searchParams.set("token", token);

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      redirectUrl.searchParams.set(key, value);
    }
  }

  const finalUrl = redirectUrl.toString();

  if (newTab) {
    window.open(finalUrl, "_blank", "noreferrer");
  } else {
    window.location.href = finalUrl;
  }
}
