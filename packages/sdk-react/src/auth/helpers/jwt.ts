const TOKEN_EXPIRATION_BUFFER_SECONDS = 10;

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return true;
    return payload.exp <= Date.now() / 1000 + TOKEN_EXPIRATION_BUFFER_SECONDS;
  } catch {
    return true;
  }
}

export function decodeSid(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sid ?? null;
  } catch {
    return null;
  }
}
