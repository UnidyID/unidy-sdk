export interface OAuthProviderElement extends HTMLElement {
  connect(): Promise<void>;
  submit(): Promise<void>;
  cancel(): Promise<void>;
}

/**
 * Find the closest oauth-provider ancestor for a given element.
 */
export function getOAuthProvider(element: HTMLElement): OAuthProviderElement | null {
  const provider = element.closest("u-oauth-provider");
  return provider as unknown as OAuthProviderElement | null;
}
