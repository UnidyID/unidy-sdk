import type { StandaloneUnidyClient, TokenResponse } from "@unidy.io/sdk/standalone";
import type { HookCallbacks } from "../types";
import { authStorage } from "./auth-storage";
import { getTokenExpiryMs, isTokenExpired, isTokenExpiringWithin } from "./helpers/jwt";

/** How long before `exp` to refresh the access token by default. */
const DEFAULT_SKEW_MS = 30_000;

// Refresh tokens rotate server-side: only a rejection for the token that is still the
// persisted one means the session is truly dead. Anything else must not clear storage.
const PERMANENT_REFRESH_ERRORS = new Set(["invalid_refresh_token", "refresh_token_revoked", "sign_in_not_found"]);

// Each stale retry means another tab/copy successfully rotated the token, so a small
// budget converges even for a burst of tabs while preventing an open-ended loop.
const MAX_STALE_REFRESH_RETRIES = 3;

// Refresh tokens rotate on use — all clients share one storage, so one in-flight request serves all.
let inflight: Promise<string | null> | null = null;
// Callbacks from every caller that joined the current flight, so a failure notifies all of them.
let inflightCallbacks = new Set<HookCallbacks>();

const notifyError = (error: string) => {
  for (const callbacks of inflightCallbacks) callbacks.onError?.(error);
};

/** Returns a valid token, or null (and clears storage) when the session is unrecoverable. */
export async function refreshSession(
  client: StandaloneUnidyClient,
  callbacks?: HookCallbacks,
  options?: { force?: boolean; signInIdFallback?: string | null },
): Promise<string | null> {
  const currentToken = authStorage.getState().token;
  if (!options?.force && currentToken && !isTokenExpired(currentToken)) {
    return currentToken;
  }

  if (callbacks) inflightCallbacks.add(callbacks);
  if (inflight) return inflight;

  inflight = (async () => {
    let staleRetriesLeft = MAX_STALE_REFRESH_RETRIES;

    while (true) {
      const { signInId: storedSignInId, refreshToken } = authStorage.getState();
      const signInId = storedSignInId ?? options?.signInIdFallback ?? null;
      if (!signInId || !refreshToken) return null;

      const [error, response] = await client.auth.refreshToken({ signInId, refreshToken });

      if (!error) {
        // Storage was mutated while in-flight (logout or new login) — discard stale result.
        if (authStorage.getState().refreshToken !== refreshToken) return null;

        const tokenResponse = response as TokenResponse;
        authStorage.setToken(tokenResponse.jwt);
        authStorage.setRefreshToken(tokenResponse.refresh_token);
        authStorage.setSignInId(tokenResponse.sid ?? signInId);
        return tokenResponse.jwt;
      }

      // Transient failure (network, 5xx, rate limit) — keep the session recoverable.
      if (!PERMANENT_REFRESH_ERRORS.has(error)) {
        notifyError(error);
        return null;
      }

      if (authStorage.getPersistedRefreshToken() === refreshToken) {
        authStorage.clearAll();
        notifyError(error);
        return null;
      }

      // Another SDK copy or tab rotated the token while this request was in flight —
      // adopt its session instead of destroying it with a stale failure.
      authStorage.syncFromStorage();
      const adoptedToken = authStorage.getState().token;
      if (adoptedToken && !isTokenExpired(adoptedToken)) return adoptedToken;

      // A cross-tab rotation can't hand us its access token (sessionStorage is per-tab),
      // so refresh again with the adopted refresh token.
      if (staleRetriesLeft <= 0) return null;
      staleRetriesLeft -= 1;
    }
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
    inflightCallbacks = new Set();
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
