import type { CreateSignInResponse, InvalidPasswordResponse, SendMagicCodeResponse, TokenResponse } from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../provider";
import { authReducer, createInitialState, isRecoverableStep } from "./auth-reducer";
import { authStorage } from "./auth-storage";
import { cleanSocialAuthParams, getSocialAuthUrl, parseSocialAuthCallback } from "./social-auth";
import type { AuthStep, UseAuthOptions, UseAuthReturn } from "./types";

const TOKEN_EXPIRATION_BUFFER_SECONDS = 10;

function isTokenExpired(token: string): boolean {
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

function decodeSid(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sid ?? null;
  } catch {
    return null;
  }
}

function extractSidFromUrl(): string | null {
  const url = new URL(window.location.href);
  const sid = url.searchParams.get("sid");
  if (!sid) return null;
  url.searchParams.delete("sid");
  window.history.replaceState({}, "", url.toString());
  return sid;
}

export function useAuth(options?: UseAuthOptions): UseAuthReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(authReducer, createInitialState(options?.initialStep ?? "email"));
  const stateRef = useRef(state);
  stateRef.current = state;
  const callbacks = options?.callbacks;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs once on mount to recover auth state
  useEffect(() => {
    if (options?.autoRecover === false) return;

    const token = authStorage.getToken();
    const refreshToken = authStorage.getRefreshToken();
    const signInIdFromStorage = authStorage.getSignInId();
    const email = authStorage.getEmail();
    const loginOptions = authStorage.getLoginOptions();

    // Check for social auth callback in URL
    const socialCallback = parseSocialAuthCallback(window.location.search);
    if (socialCallback) {
      cleanSocialAuthParams();

      if (socialCallback.result) {
        dispatch({
          type: "AUTH_SUCCESS",
          token: socialCallback.result.idToken,
          refreshToken: socialCallback.result.refreshToken,
          signInId: socialCallback.result.signInId,
        });
        if (email) dispatch({ type: "SET_EMAIL", email });
        return;
      }

      if (socialCallback.error) {
        dispatch({ type: "SET_ERROR", field: "global", message: socialCallback.error });
      }
      return;
    }

    const sidFromUrl = extractSidFromUrl();
    if (sidFromUrl) {
      authStorage.setSignInId(sidFromUrl);
      dispatch({ type: "SET_SIGNIN_ID", signInId: sidFromUrl });
    }
    const signInId = sidFromUrl ?? signInIdFromStorage;

    // Has a valid (non-expired) token
    if (token && !isTokenExpired(token)) {
      const sid = signInId ?? decodeSid(token);
      dispatch({
        type: "RECOVER_STATE",
        state: {
          isAuthenticated: true,
          token,
          signInId: sid,
          email: email ?? "",
          step: "authenticated",
        },
      });
      return;
    }

    // Token expired but refresh token exists - try refresh
    if (refreshToken && signInId) {
      (async () => {
        dispatch({ type: "SET_LOADING", loading: true });
        const [error, response] = await client.auth.refreshToken({
          signInId,
          refreshToken,
        });

        if (error) {
          authStorage.clearAll();
          dispatch({ type: "SET_LOADING", loading: false });
          if (email) dispatch({ type: "SET_EMAIL", email });
          if (loginOptions) dispatch({ type: "SET_LOGIN_OPTIONS", options: loginOptions });
          return;
        }

        const tokenResponse = response as TokenResponse;
        dispatch({
          type: "AUTH_SUCCESS",
          token: tokenResponse.jwt,
          refreshToken: tokenResponse.refresh_token,
          signInId: tokenResponse.sid ?? signInId,
        });
        if (email) dispatch({ type: "SET_EMAIL", email });
      })();
      return;
    }

    // Magic-link redirect flow can return with only `sid` in URL.
    // Mirror Stencil behavior: check backend signed-in state and hydrate tokens.
    if (sidFromUrl || (signInId && !token && !refreshToken)) {
      (async () => {
        dispatch({ type: "SET_LOADING", loading: true });
        const [error, response] = await client.auth.signedIn();
        dispatch({ type: "SET_LOADING", loading: false });

        if (error) {
          if (email) dispatch({ type: "SET_EMAIL", email });
          if (loginOptions) dispatch({ type: "SET_LOGIN_OPTIONS", options: loginOptions });
          return;
        }

        const tokenResponse = response as TokenResponse;
        dispatch({
          type: "AUTH_SUCCESS",
          token: tokenResponse.jwt,
          refreshToken: tokenResponse.refresh_token,
          signInId: tokenResponse.sid ?? signInId ?? undefined,
        });
        if (email) dispatch({ type: "SET_EMAIL", email });
      })();
      return;
    }

    // Recover non-auth state (email, login options, recoverable step)
    if (email) dispatch({ type: "SET_EMAIL", email });
    if (loginOptions) dispatch({ type: "SET_LOGIN_OPTIONS", options: loginOptions });

    const storedStep = authStorage.getRecoverableStep();
    if (storedStep && isRecoverableStep(storedStep) && signInId) {
      dispatch({ type: "SET_SIGNIN_ID", signInId });
      dispatch({ type: "RECOVER_STATE", state: { step: storedStep as AuthStep } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Actions ---

  const submitEmail = useCallback(
    async (email: string, submitOptions?: { sendMagicCode?: boolean }) => {
      dispatch({ type: "SET_EMAIL", email });
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "CLEAR_ERRORS" });

      const [error, response] = await client.auth.createSignIn({
        payload: { email, sendMagicCode: submitOptions?.sendMagicCode, originUrl: window.location.href },
      });

      if (error) {
        if (error === "magic_code_recently_created") {
          const sid = stateRef.current.signInId;
          if (sid) authStorage.setSignInId(sid);
          dispatch({ type: "SET_LOADING", loading: false });
          dispatch({ type: "SET_STEP", step: "magic-code" });
          dispatch({ type: "SET_ERROR", field: "magicCode", message: error });
          return;
        }

        dispatch({ type: "SET_LOADING", loading: false });
        dispatch({ type: "SET_ERROR", field: "email", message: error });
        callbacks?.onError?.(error);
        return;
      }

      // If sendMagicCode was requested and succeeded
      if (submitOptions?.sendMagicCode) {
        const mcResponse = response as SendMagicCodeResponse;
        const sid = mcResponse.sid ?? stateRef.current.signInId;
        if (sid) {
          dispatch({ type: "SET_SIGNIN_ID", signInId: sid });
          authStorage.setSignInId(sid);
        }
        dispatch({ type: "SET_LOADING", loading: false });
        dispatch({ type: "SET_STEP", step: "magic-code" });
        if (mcResponse.enable_resend_after) {
          dispatch({ type: "SET_MAGIC_CODE_RESEND_AFTER", time: mcResponse.enable_resend_after });
        }
        return;
      }

      const signInResponse = response as CreateSignInResponse;
      dispatch({ type: "SET_SIGNIN_ID", signInId: signInResponse.sid });
      dispatch({ type: "SET_LOGIN_OPTIONS", options: signInResponse.login_options });
      authStorage.setSignInId(signInResponse.sid);
      authStorage.setEmail(email);
      authStorage.setLoginOptions(signInResponse.login_options);
      dispatch({ type: "SET_LOADING", loading: false });
      dispatch({ type: "SET_STEP", step: "verification" });
    },
    [client, callbacks],
  );

  const submitPassword = useCallback(
    async (password: string) => {
      const { signInId } = stateRef.current;
      if (!signInId) {
        dispatch({ type: "SET_ERROR", field: "global", message: "No sign-in session" });
        return;
      }

      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "CLEAR_ERRORS" });

      const [error, response] = await client.auth.authenticateWithPassword({
        signInId,
        payload: { password },
      });

      if (error) {
        dispatch({ type: "SET_LOADING", loading: false });

        if (error === "missing_required_fields") {
          // TODO: handle missing fields flow
          dispatch({ type: "SET_ERROR", field: "global", message: error });
          callbacks?.onError?.(error);
          return;
        }
        if (error === "brand_connection_required") {
          // TODO: handle brand connect flow
          dispatch({ type: "SET_ERROR", field: "global", message: error });
          callbacks?.onError?.(error);
          return;
        }
        if (error === "invalid_password") {
          const details = response as unknown as InvalidPasswordResponse;
          const message = details?.error_details?.password?.join(", ") ?? error;
          dispatch({ type: "SET_ERROR", field: "password", message });
        } else {
          dispatch({ type: "SET_ERROR", field: "password", message: error });
        }
        callbacks?.onError?.(error);
        return;
      }

      const tokenResponse = response as TokenResponse;
      dispatch({
        type: "AUTH_SUCCESS",
        token: tokenResponse.jwt,
        refreshToken: tokenResponse.refresh_token,
        signInId: tokenResponse.sid ?? signInId,
      });
      callbacks?.onSuccess?.("Authenticated successfully");
    },
    [client, callbacks],
  );

  const sendMagicCode = useCallback(async () => {
    const { signInId, email } = stateRef.current;

    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "CLEAR_ERRORS" });

    // Match Stencil behavior: if no existing sign-in session, create one and request magic code in one call.
    const [error, response] = signInId
      ? await client.auth.sendMagicCode({ signInId })
      : await client.auth.createSignIn({
          payload: {
            email,
            sendMagicCode: true,
            originUrl: window.location.href,
          },
        });

    dispatch({ type: "SET_LOADING", loading: false });

    if (error) {
      dispatch({ type: "SET_ERROR", field: "magicCode", message: error });
      if (error === "magic_code_recently_created") {
        const mcError = response as { enable_resend_after?: number };
        if (mcError?.enable_resend_after) {
          dispatch({ type: "SET_MAGIC_CODE_RESEND_AFTER", time: mcError.enable_resend_after });
        }
      }
      return;
    }

    const mcResponse = response as SendMagicCodeResponse;
    const sid = mcResponse.sid ?? stateRef.current.signInId;
    if (sid) {
      dispatch({ type: "SET_SIGNIN_ID", signInId: sid });
      authStorage.setSignInId(sid);
    }
    dispatch({ type: "SET_STEP", step: "magic-code" });
    if (mcResponse.enable_resend_after) {
      dispatch({ type: "SET_MAGIC_CODE_RESEND_AFTER", time: mcResponse.enable_resend_after });
    }
    authStorage.setMagicCodeStep("sent");
  }, [client]);

  const submitMagicCode = useCallback(
    async (code: string) => {
      const { signInId } = stateRef.current;
      if (!signInId) {
        dispatch({ type: "SET_ERROR", field: "global", message: "No sign-in session" });
        return;
      }

      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "CLEAR_ERRORS" });

      const [error, response] = await client.auth.authenticateWithMagicCode({
        signInId,
        payload: { code },
      });

      if (error) {
        dispatch({ type: "SET_LOADING", loading: false });

        if (error === "missing_required_fields") {
          dispatch({ type: "SET_ERROR", field: "global", message: error });
          callbacks?.onError?.(error);
          return;
        }
        if (error === "brand_connection_required") {
          dispatch({ type: "SET_ERROR", field: "global", message: error });
          callbacks?.onError?.(error);
          return;
        }

        dispatch({ type: "SET_ERROR", field: "magicCode", message: error });
        callbacks?.onError?.(error);
        return;
      }

      const tokenResponse = response as TokenResponse;
      dispatch({
        type: "AUTH_SUCCESS",
        token: tokenResponse.jwt,
        refreshToken: tokenResponse.refresh_token,
        signInId: tokenResponse.sid ?? signInId,
      });
      callbacks?.onSuccess?.("Authenticated successfully");
    },
    [client, callbacks],
  );

  // TODO: Implement passkey/WebAuthn authentication (navigator.credentials.get(), challenge handling)
  // See: packages/sdk/src/auth/passkey-auth.ts for reference implementation

  const buildSocialAuthUrl = useCallback(
    (provider: string, redirectUri: string): string => {
      const baseUrl = "baseUrl" in client ? (client.baseUrl as string) : "";
      return getSocialAuthUrl(baseUrl, provider, redirectUri);
    },
    [client],
  );

  const handleSocialAuthCallback = useCallback(async () => {
    const socialCallback = parseSocialAuthCallback(window.location.search);
    if (!socialCallback) return;

    cleanSocialAuthParams();

    if (socialCallback.result) {
      dispatch({
        type: "AUTH_SUCCESS",
        token: socialCallback.result.idToken,
        refreshToken: socialCallback.result.refreshToken,
        signInId: socialCallback.result.signInId,
      });
      callbacks?.onSuccess?.("Authenticated successfully");
      return;
    }

    if (socialCallback.error) {
      dispatch({ type: "SET_ERROR", field: "global", message: socialCallback.error });
      callbacks?.onError?.(socialCallback.error);
    }
  }, [callbacks]);

  const sendResetPasswordEmail = useCallback(
    async (returnTo?: string) => {
      const { signInId } = stateRef.current;
      if (!signInId) {
        dispatch({ type: "SET_ERROR", field: "global", message: "No sign-in session" });
        return;
      }

      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "CLEAR_ERRORS" });

      const [error] = await client.auth.sendResetPasswordEmail({
        signInId,
        payload: { returnTo: returnTo ?? window.location.href },
      });

      dispatch({ type: "SET_LOADING", loading: false });

      if (error) {
        dispatch({ type: "SET_ERROR", field: "resetPassword", message: error });
        callbacks?.onError?.(error);
        return;
      }

      dispatch({ type: "SET_RESET_PASSWORD_STEP", step: "sent" });
      callbacks?.onSuccess?.("Reset password email sent");
    },
    [client, callbacks],
  );

  const resetPasswordAction = useCallback(
    async (token: string, password: string, confirmation: string) => {
      const { signInId } = stateRef.current;
      if (!signInId) {
        dispatch({ type: "SET_ERROR", field: "global", message: "No sign-in session" });
        return;
      }

      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "CLEAR_ERRORS" });

      const [error] = await client.auth.resetPassword({
        signInId,
        token,
        payload: { password, passwordConfirmation: confirmation },
      });

      dispatch({ type: "SET_LOADING", loading: false });

      if (error) {
        dispatch({ type: "SET_ERROR", field: "resetPassword", message: error });
        callbacks?.onError?.(error);
        return;
      }

      dispatch({ type: "SET_RESET_PASSWORD_STEP", step: "idle" });
      dispatch({ type: "SET_STEP", step: "email" });
      callbacks?.onSuccess?.("Password reset successfully");
    },
    [client, callbacks],
  );

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const goToStep = useCallback((step: AuthStep) => {
    dispatch({ type: "SET_STEP", step });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: "RESTART" });
  }, []);

  const logout = useCallback(async () => {
    const { signInId } = stateRef.current;
    if (signInId) {
      await client.auth.signOut({ signInId });
    }
    dispatch({ type: "LOGOUT" });
    callbacks?.onSuccess?.("Logged out");
  }, [client, callbacks]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const currentToken = stateRef.current.token ?? authStorage.getToken();
    if (currentToken && !isTokenExpired(currentToken)) {
      return currentToken;
    }

    // Try refresh
    const signInId = stateRef.current.signInId ?? authStorage.getSignInId();
    const refreshTokenValue = authStorage.getRefreshToken();

    if (!signInId || !refreshTokenValue) {
      dispatch({ type: "LOGOUT" });
      return null;
    }

    const [error, response] = await client.auth.refreshToken({
      signInId,
      refreshToken: refreshTokenValue,
    });

    if (error) {
      dispatch({ type: "LOGOUT" });
      return null;
    }

    const tokenResponse = response as TokenResponse;
    dispatch({
      type: "AUTH_SUCCESS",
      token: tokenResponse.jwt,
      refreshToken: tokenResponse.refresh_token,
      signInId: tokenResponse.sid ?? signInId,
    });

    return tokenResponse.jwt;
  }, [client]);

  return {
    step: state.step,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    email: state.email,
    loginOptions: state.loginOptions,
    errors: state.errors,
    magicCodeResendAfter: state.magicCodeResendAfter,
    resetPasswordStep: state.resetPasswordStep,
    canGoBack: state.stepHistory.length > 0,

    submitEmail,
    submitPassword,
    sendMagicCode,
    submitMagicCode,
    getSocialAuthUrl: buildSocialAuthUrl,
    handleSocialAuthCallback,
    sendResetPasswordEmail,
    resetPassword: resetPasswordAction,

    goBack,
    goToStep,
    restart,

    logout,
    getToken,
  };
}
