import type { CreateSignInResponse, InvalidPasswordResponse, SendMagicCodeResponse, TokenResponse } from "@unidy.io/sdk/standalone";
import { type Dispatch, type MutableRefObject, useCallback } from "react";
import type { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { authStorage } from "../auth-storage";
import { cleanSocialAuthParams, getSocialAuthUrl, parseSocialAuthCallback } from "../social-auth";
import type { AuthAction, AuthState, UseLoginReturn } from "../types";

export type LoginActions = Pick<
  UseLoginReturn,
  | "submitEmail"
  | "submitPassword"
  | "sendMagicCode"
  | "submitMagicCode"
  | "getSocialAuthUrl"
  | "handleSocialAuthCallback"
  | "sendResetPasswordEmail"
  | "resetPassword"
  | "goBack"
  | "goToStep"
  | "restart"
>;

interface UseLoginActionsOptions {
  client: ReturnType<typeof useUnidyClient>;
  stateRef: MutableRefObject<AuthState>;
  dispatch: Dispatch<AuthAction>;
  callbacks?: HookCallbacks;
}

export function useLoginActions({ client, stateRef, dispatch, callbacks }: UseLoginActionsOptions): LoginActions {
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
    [client, callbacks, dispatch, stateRef],
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
          dispatch({ type: "SET_ERROR", field: "global", message: error });
          callbacks?.onError?.(error);
          return;
        }
        if (error === "brand_connection_required") {
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
    [client, callbacks, dispatch, stateRef],
  );

  const sendMagicCode = useCallback(async () => {
    const { signInId, email } = stateRef.current;

    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "CLEAR_ERRORS" });

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
  }, [client, dispatch, stateRef]);

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
    [client, callbacks, dispatch, stateRef],
  );

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
  }, [callbacks, dispatch]);

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
    [client, callbacks, dispatch, stateRef],
  );

  const resetPassword = useCallback(
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
    [client, callbacks, dispatch, stateRef],
  );

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, [dispatch]);

  const goToStep = useCallback(
    (step: AuthState["step"]) => {
      dispatch({ type: "SET_STEP", step });
    },
    [dispatch],
  );

  const restart = useCallback(() => {
    dispatch({ type: "RESTART" });
  }, [dispatch]);

  return {
    submitEmail,
    submitPassword,
    sendMagicCode,
    submitMagicCode,
    getSocialAuthUrl: buildSocialAuthUrl,
    handleSocialAuthCallback,
    sendResetPasswordEmail,
    resetPassword,
    goBack,
    goToStep,
    restart,
  };
}
