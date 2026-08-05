import type { StandaloneUnidyClient, TokenResponse } from "@unidy.io/sdk/standalone";
import type { HookCallbacks } from "../types";
import { authStorage } from "./auth-storage";
import { getTokenExpiryMs, isTokenExpired, isTokenExpiringWithin } from "./helpers/jwt";

/** How long before `exp` to refresh the access token by default. */
const DEFAULT_SKEW_MS = 30_000;

// Refresh tokens rotate on use — all clients share one storage, so one in-flight request serves all.
let inflight: Promise<string | null> | null = null;

/** Returns a valid token, or null (and clears storage) when the session is unrecoverable. */
export async function refreshSession(
  client: StandaloneUnidyClient,
  callbacks?: HookCallbacks,
  options?: { force?: boolean },
): Promise<string | null> {
  const currentToken = authStorage.getState().token;
  if (!options?.force && currentToken && !isTokenExpired(currentToken)) {
    return currentToken;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    const { signInId, refreshToken } = authStorage.getState();
    if (!signInId || !refreshToken) {
      authStorage.clearAll();
      return null;
    }

    const [error, response] = await client.auth.refreshToken({ signInId, refreshToken });
    if (error) {
      authStorage.clearAll();
      callbacks?.onError?.(error);
      return null;
    }

    const tokenResponse = response as TokenResponse;
    authStorage.setToken(tokenResponse.jwt);
    authStorage.setRefreshToken(tokenResponse.refresh_token);
    authStorage.setSignInId(tokenResponse.sid ?? signInId);
    return tokenResponse.jwt;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export interface SessionAutoRefreshOptions {
  /** Refresh this many milliseconds before the token expires. Default: 30000. */
  skewMs?: number;
  /** Forwarded to the background refresh for success/error reporting. */
  callbacks?: HookCallbacks;
}

/** Keeps the session alive: refreshes before expiry and on tab focus/visibility. Returns cleanup. No-op during SSR. */
export function startSessionAutoRefresh(client: StandaloneUnidyClient, options: SessionAutoRefreshOptions = {}): () => void {
  if (typeof window === "undefined") return () => {};

  const skewMs = options.skewMs ?? DEFAULT_SKEW_MS;
  const { callbacks } = options;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  /** (Re)arm the pre-expiry timer based on the current token's expiry. */
  const schedule = () => {
    clearTimer();
    if (disposed) return;

    const { token, refreshToken, signInId } = authStorage.getState();
    // Nothing to keep alive.
    if (!refreshToken || !signInId) return;

    // No/expired token but a refresh token exists → refresh immediately.
    if (!token || isTokenExpired(token)) {
      void refreshSession(client, callbacks, { force: true });
      return;
    }

    const expiryMs = getTokenExpiryMs(token);
    if (expiryMs === null) {
      void refreshSession(client, callbacks, { force: true });
      return;
    }

    const delay = Math.max(0, expiryMs - Date.now() - skewMs);
    timer = setTimeout(() => {
      void refreshSession(client, callbacks, { force: true });
    }, delay);
  };

  /** Refresh on focus/visibility, but only if the token is gone or near expiry. */
  const refreshIfNeeded = () => {
    const { token, refreshToken, signInId } = authStorage.getState();
    if (!refreshToken || !signInId) return;
    if (token && !isTokenExpiringWithin(token, skewMs)) return;
    void refreshSession(client, callbacks, { force: true });
  };

  const onFocus = refreshIfNeeded;
  const onVisibility = () => {
    if (document.visibilityState === "visible") refreshIfNeeded();
  };

  // One refresh writes token + refreshToken + signInId, each firing subscribers — dedup via microtask.
  let schedulePending = false;
  const debouncedSchedule = () => {
    if (schedulePending) return;
    schedulePending = true;
    queueMicrotask(() => {
      schedulePending = false;
      if (!disposed) schedule();
    });
  };

  // Re-arm the timer whenever auth storage changes (token rotated, login,
  // logout, or a change propagated from another tab).
  const unsubscribe = authStorage.subscribe(debouncedSchedule);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);

  schedule();

  return () => {
    disposed = true;
    clearTimer();
    unsubscribe();
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
