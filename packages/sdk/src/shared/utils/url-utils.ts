/**
 * Removes a query parameter from the current URL and updates the browser history.
 * Uses `replaceState` to avoid adding a new history entry.
 *
 * @param param - The name of the query parameter to remove
 * @returns The value of the removed parameter, or null if it wasn't present
 *
 * @example
 * ```ts
 * // URL: https://example.com?token=abc123&foo=bar
 * const token = clearUrlParam("token");
 * // token = "abc123"
 * // URL is now: https://example.com?foo=bar
 * ```
 */
export function clearUrlParam(param: string): string | null {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(param);

  if (value) {
    url.searchParams.delete(param);
    window.history.replaceState(null, "", url.toString());
  }

  return value;
}
