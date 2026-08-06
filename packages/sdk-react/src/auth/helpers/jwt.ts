const TOKEN_EXPIRATION_BUFFER_SECONDS = 10;

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token);
  if (!payload || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return true;
  return payload.exp <= Date.now() / 1000 + TOKEN_EXPIRATION_BUFFER_SECONDS;
}

/** Token expiry as epoch milliseconds, or null if the token has no parseable `exp`. */
export function getTokenExpiryMs(token: string): number | null {
  const payload = decodePayload(token);
  if (!payload || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return null;
  return payload.exp * 1000;
}

/**
 * True if the token is already expired/unparseable or will expire within `withinMs`.
 * Used to refresh proactively before `exp` rather than only after.
 */
export function isTokenExpiringWithin(token: string, withinMs: number): boolean {
  const expiryMs = getTokenExpiryMs(token);
  if (expiryMs === null) return true;
  return expiryMs - Date.now() <= withinMs;
}

export function decodeSid(token: string): string | null {
  const payload = decodePayload(token);
  const sid = payload?.sid;
  return typeof sid === "string" ? sid : null;
}
