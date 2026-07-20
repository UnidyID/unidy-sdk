import type {
  CreateSignInResponse,
  InvalidPasswordResponse,
  PasskeyOptionsResponse,
  RequiredFieldsResponse,
  SendMagicCodeResponse,
  TokenResponse,
} from "@unidy.io/sdk/standalone";
import { type Dispatch, type MutableRefObject, useCallback } from "react";
import type { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { authStorage } from "../auth-storage";
import { buildPublicKeyRequestOptions, formatAssertionCredentialForServer, isWebAuthnSupported, PASSKEY_ERRORS } from "../passkey-utils";
import { cleanSocialAuthParams, getSocialAuthUrl, parseSocialAuthCallback } from "../social-auth";
import type { AuthAction, AuthState, UseLoginReturn } from "../types";

export type LoginActions = Pick<
  UseLoginReturn,
  | "submitEmail"
  | "submitPassword"
  | "sendMagicCode"
  | "submitMagicCode"
  | "authenticateWithPasskey"
  | "getSocialAuthUrl"
  | "handleSocialAuthCallback"
  | "sendResetPasswordEmail"
  | "resetPassword"
  | "validateResetPasswordToken"
  | "resendConfirmation"
  | "resendInvitation"
  | "connectBrand"
  | "cancelBrandConnect"
  | "submitMissingFields"
  | "checkPendingRegistration"
  | "goBack"
  | "goToStep"
  | "restart"
  | "reset"
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

        if (error === "account_unconfirmed") {
          const loginType = (response as { login_type?: string })?.login_type;
          dispatch({ type: "SET_LOADING", loading: false });
          dispatch({ type: "SET_STEP", step: loginType === "invited" ? "invited" : "unconfirmed" });
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

        if (error === "account_unconfirmed") {
          const loginType = (response as { login_type?: string })?.login_type;
          dispatch({ type: "SET_STEP", step: loginType === "invited" ? "invited" : "unconfirmed" });
          return;
        }
        if (error === "brand_connection_required") {
          const brandResponse = response as { sid?: string | null };
          if (brandResponse?.sid) {
            dispatch({ type: "SET_SIGNIN_ID", signInId: brandResponse.sid });
            authStorage.setSignInId(brandResponse.sid);
          }
          dispatch({ type: "SET_STEP", step: "connect-brand" });
          return;
        }
        if (error === "missing_required_fields") {
          const fieldsResponse = response as RequiredFieldsResponse;
          if (fieldsResponse?.sid) {
            dispatch({ type: "SET_SIGNIN_ID", signInId: fieldsResponse.sid });
            authStorage.setSignInId(fieldsResponse.sid);
          }
          dispatch({ type: "SET_MISSING_FIELD_DEFINITIONS", fields: fieldsResponse.fields as Record<string, unknown> });
          dispatch({ type: "SET_STEP", step: "missing-fields" });
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

        if (error === "account_unconfirmed") {
          const loginType = (response as { login_type?: string })?.login_type;
          dispatch({ type: "SET_STEP", step: loginType === "invited" ? "invited" : "unconfirmed" });
          return;
        }
        if (error === "brand_connection_required") {
          const brandResponse = response as { sid?: string | null };
          if (brandResponse?.sid) {
            dispatch({ type: "SET_SIGNIN_ID", signInId: brandResponse.sid });
            authStorage.setSignInId(brandResponse.sid);
          }
          dispatch({ type: "SET_STEP", step: "connect-brand" });
          return;
        }
        if (error === "missing_required_fields") {
          const fieldsResponse = response as RequiredFieldsResponse;
          if (fieldsResponse?.sid) {
            dispatch({ type: "SET_SIGNIN_ID", signInId: fieldsResponse.sid });
            authStorage.setSignInId(fieldsResponse.sid);
          }
          dispatch({ type: "SET_MISSING_FIELD_DEFINITIONS", fields: fieldsResponse.fields as Record<string, unknown> });
          dispatch({ type: "SET_STEP", step: "missing-fields" });
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

  const authenticateWithPasskey = useCallback(async () => {
    if (!isWebAuthnSupported()) {
      dispatch({ type: "SET_ERROR", field: "passkey", message: "passkey_not_supported" });
      callbacks?.onError?.("passkey_not_supported");
      return;
    }

    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "CLEAR_ERRORS" });

    try {
      const { signInId } = stateRef.current;
      const [optionsError, options] = await client.auth.getPasskeyOptions(signInId ? { signInId } : undefined);

      if (optionsError || !options) {
        dispatch({ type: "SET_LOADING", loading: false });
        dispatch({ type: "SET_ERROR", field: "passkey", message: optionsError || "bad_request" });
        callbacks?.onError?.(optionsError || "bad_request");
        return;
      }

      const publicKeyOptions = buildPublicKeyRequestOptions(options as PasskeyOptionsResponse);
      const credential = (await navigator.credentials.get({ publicKey: publicKeyOptions })) as PublicKeyCredential | null;

      if (!credential) {
        dispatch({ type: "SET_LOADING", loading: false });
        dispatch({ type: "SET_ERROR", field: "passkey", message: "passkey_cancelled" });
        callbacks?.onError?.("passkey_cancelled");
        return;
      }

      const formattedCredential = formatAssertionCredentialForServer(credential);
      const [verifyError, tkResponse] = await client.auth.authenticateWithPasskey({
        payload: { credential: formattedCredential },
      });

      const tokenResponse = tkResponse as TokenResponse;
      if (verifyError || !tokenResponse) {
        dispatch({ type: "SET_LOADING", loading: false });
        dispatch({ type: "SET_ERROR", field: "passkey", message: verifyError || "authentication_failed" });
        callbacks?.onError?.(verifyError || "authentication_failed");
        return;
      }

      dispatch({
        type: "AUTH_SUCCESS",
        token: tokenResponse.jwt,
        refreshToken: tokenResponse.refresh_token,
        signInId: tokenResponse.sid ?? stateRef.current.signInId ?? undefined,
      });
      callbacks?.onSuccess?.("Authenticated successfully");
    } catch (error) {
      dispatch({ type: "SET_LOADING", loading: false });
      let errorMessage = "passkey_error";
      if (error instanceof DOMException) {
        errorMessage = PASSKEY_ERRORS[error.name] || "passkey_error";
      }
      dispatch({ type: "SET_ERROR", field: "passkey", message: errorMessage });
      callbacks?.onError?.(errorMessage);
    }
  }, [client, callbacks, dispatch, stateRef]);

  const buildSocialAuthUrl = useCallback(
    (provider: string, redirectUri: string): string => {
      if (!("baseUrl" in client) || typeof client.baseUrl !== "string" || !client.baseUrl) {
        throw new Error("[useLogin] getSocialAuthUrl: client does not expose a baseUrl");
      }
      return getSocialAuthUrl(client.baseUrl, provider, redirectUri);
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

    if (socialCallback.error === "brand_connection_required") {
      // Social auth returned brand connection required — extract sid from URL
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("sid");
      if (sid) {
        dispatch({ type: "SET_SIGNIN_ID", signInId: sid });
        authStorage.setSignInId(sid);
      }
      dispatch({ type: "SET_STEP", step: "connect-brand" });
      return;
    }

    if (socialCallback.error === "missing_required_fields" && socialCallback.fields) {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("sid");
      if (sid) {
        dispatch({ type: "SET_SIGNIN_ID", signInId: sid });
        authStorage.setSignInId(sid);
      }
      dispatch({ type: "SET_MISSING_FIELD_DEFINITIONS", fields: socialCallback.fields });
      dispatch({ type: "SET_STEP", step: "missing-fields" });
      return;
    }

    if (socialCallback.error) {
      dispatch({ type: "SET_ERROR", field: "global", message: socialCallback.error });
      callbacks?.onError?.(socialCallback.error);
    }
  }, [callbacks, dispatch]);

  const sendResetPasswordEmail = useCallback(
    async (returnTo?: string) => {
      const signInId = stateRef.current.signInId ?? authStorage.getSignInId();
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
      const signInId = stateRef.current.signInId ?? authStorage.getSignInId();
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

  const connectBrand = useCallback(async () => {
    const { signInId } = stateRef.current;
    if (!signInId) {
      dispatch({ type: "SET_ERROR", field: "global", message: "No sign-in session" });
      return;
    }

    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "CLEAR_ERRORS" });

    const [error, response] = await client.auth.connectBrand({ signInId });

    dispatch({ type: "SET_LOADING", loading: false });

    if (error) {
      if (error === "missing_required_fields") {
        const fieldsResponse = response as RequiredFieldsResponse;
        if (fieldsResponse?.sid) {
          dispatch({ type: "SET_SIGNIN_ID", signInId: fieldsResponse.sid });
          authStorage.setSignInId(fieldsResponse.sid);
        }
        dispatch({ type: "SET_MISSING_FIELD_DEFINITIONS", fields: fieldsResponse.fields as Record<string, unknown> });
        dispatch({ type: "SET_STEP", step: "missing-fields" });
        return;
      }

      dispatch({ type: "SET_ERROR", field: "global", message: error });
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
    callbacks?.onSuccess?.("Brand connected successfully");
  }, [client, callbacks, dispatch, stateRef]);

  const cancelBrandConnect = useCallback(async () => {
    const { signInId } = stateRef.current;
    if (signInId) {
      await client.auth.signOut({ signInId });
    }
    authStorage.clearAll();
    dispatch({ type: "RESTART" });
  }, [client, dispatch, stateRef]);

  const submitMissingFields = useCallback(
    async (fields: Record<string, unknown>) => {
      const { signInId } = stateRef.current;
      if (!signInId) {
        dispatch({ type: "SET_ERROR", field: "global", message: "No sign-in session" });
        return;
      }

      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "CLEAR_ERRORS" });

      const [error, response] = await client.auth.updateMissingFields({
        signInId,
        payload: { user: fields },
      });

      dispatch({ type: "SET_LOADING", loading: false });

      if (error) {
        if (error === "missing_required_fields") {
          // Server returned more missing fields
          const fieldsResponse = response as RequiredFieldsResponse;
          dispatch({ type: "SET_MISSING_FIELD_DEFINITIONS", fields: fieldsResponse.fields as Record<string, unknown> });
          dispatch({ type: "SET_ERROR", field: "missingFields", message: "Please fill in all required fields" });
          return;
        }

        dispatch({ type: "SET_ERROR", field: "missingFields", message: error });
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

  const checkPendingRegistration = useCallback(
    async (email: string): Promise<"resume-link-sent" | "not-found" | "error"> => {
      const [errorCode] = await client.auth.sendResumeLink({ email });
      if (errorCode === null) {
        return "resume-link-sent";
      }

      const code = errorCode as string;
      if (code === "connection_failed" || code === "schema_validation_error" || code === "internal_error") {
        return "error";
      }

      return "not-found";
    },
    [client],
  );

  const validateResetPasswordToken = useCallback(
    async (token: string): Promise<boolean> => {
      const signInId = stateRef.current.signInId ?? authStorage.getSignInId();
      if (!signInId) {
        dispatch({ type: "SET_ERROR", field: "global", message: "No sign-in session" });
        return false;
      }

      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "CLEAR_ERRORS" });

      const [error] = await client.auth.validateResetPasswordToken({ signInId, token });

      dispatch({ type: "SET_LOADING", loading: false });

      if (error) {
        dispatch({ type: "SET_ERROR", field: "resetPassword", message: error });
        callbacks?.onError?.(error);
        return false;
      }

      callbacks?.onSuccess?.("Reset password token is valid");
      return true;
    },
    [client, callbacks, dispatch, stateRef],
  );

  const resendConfirmation = useCallback(
    async (email: string, captchaToken?: string) => {
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "CLEAR_ERRORS" });

      const [error] = await client.auth.resendConfirmation({
        payload: { email, captchaToken },
      });

      dispatch({ type: "SET_LOADING", loading: false });

      if (error) {
        dispatch({ type: "SET_ERROR", field: "global", message: error });
        callbacks?.onError?.(error);
        return;
      }

      callbacks?.onSuccess?.("Confirmation email sent");
    },
    [client, callbacks, dispatch],
  );

  const resendInvitation = useCallback(
    async (email: string) => {
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "CLEAR_ERRORS" });

      const [error] = await client.auth.resendInvitation({
        payload: { email, returnTo: window.location.href },
      });

      dispatch({ type: "SET_LOADING", loading: false });

      if (error) {
        dispatch({ type: "SET_ERROR", field: "global", message: error });
        callbacks?.onError?.(error);
        return;
      }

      callbacks?.onSuccess?.("Invitation email sent");
    },
    [client, callbacks, dispatch],
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

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, [dispatch]);

  return {
    submitEmail,
    submitPassword,
    sendMagicCode,
    submitMagicCode,
    authenticateWithPasskey,
    getSocialAuthUrl: buildSocialAuthUrl,
    handleSocialAuthCallback,
    sendResetPasswordEmail,
    resetPassword,
    validateResetPasswordToken,
    resendConfirmation,
    resendInvitation,
    connectBrand,
    cancelBrandConnect,
    submitMissingFields,
    checkPendingRegistration,
    goBack,
    goToStep,
    restart,
    reset,
  };
}
