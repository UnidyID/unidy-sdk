import type { TokenResponse } from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useUnidyClient } from "../../provider";
import { authStorage } from "../auth-storage";
import { isTokenExpired } from "../helpers/jwt";
import { extractSidFromUrl } from "../helpers/url";
import type { UseSessionOptions, UseSessionReturn } from "../types";

export function useSession(options?: UseSessionOptions): UseSessionReturn {
  const client = useUnidyClient();
  const callbacks = options?.callbacks;
  const authState = useSyncExternalStore(authStorage.subscribe, authStorage.getState, authStorage.getState);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = useCallback(async (): Promise<string | null> => {
    const currentToken = authStorage.getState().token;
    if (currentToken && !isTokenExpired(currentToken)) {
      return currentToken;
    }

    const { signInId, refreshToken } = authStorage.getState();
    if (!signInId || !refreshToken) {
      authStorage.clearAll();
      return null;
    }

    const [error, response] = await client.auth.refreshToken({
      signInId,
      refreshToken,
    });

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
  }, [callbacks, client]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs once on mount to recover session state
  useEffect(() => {
    if (options?.autoRecover === false) return;

    const sidFromUrl = extractSidFromUrl();
    if (sidFromUrl) {
      authStorage.setSignInId(sidFromUrl);
    }

    const { token, signInId, refreshToken } = authStorage.getState();
    if (token && !isTokenExpired(token)) return;

    if (refreshToken && signInId) {
      setIsLoading(true);
      void (async () => {
        const refreshed = await getToken();
        setIsLoading(false);
        if (!refreshed) return;
        callbacks?.onSuccess?.("Session restored");
      })();
      return;
    }

    if (sidFromUrl || (signInId && !token && !refreshToken)) {
      setIsLoading(true);
      void (async () => {
        const [error, response] = await client.auth.signedIn();
        setIsLoading(false);

        if (error) {
          callbacks?.onError?.(error);
          return;
        }

        const tokenResponse = response as TokenResponse;
        authStorage.setToken(tokenResponse.jwt);
        authStorage.setRefreshToken(tokenResponse.refresh_token);
        const sessionSignInId = tokenResponse.sid ?? signInId;
        if (sessionSignInId) authStorage.setSignInId(sessionSignInId);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    const signInId = authStorage.getSignInId();
    if (signInId) {
      await client.auth.signOut({ signInId });
    }
    authStorage.clearAll();
    callbacks?.onSuccess?.("Logged out");
  }, [callbacks, client]);

  return {
    isAuthenticated: !!authState.token && !isTokenExpired(authState.token),
    isLoading,
    email: authState.email ?? "",
    signInId: authState.signInId,
    logout,
    getToken,
  };
}
