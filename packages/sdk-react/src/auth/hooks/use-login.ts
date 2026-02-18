import { useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import { authReducer, createInitialState, isRecoverableStep } from "../auth-reducer";
import { authStorage } from "../auth-storage";
import { decodeSid, isTokenExpired } from "../helpers/jwt";
import { extractSidFromUrl } from "../helpers/url";
import { cleanSocialAuthParams, parseSocialAuthCallback } from "../social-auth";
import type { AuthStep, UseLoginOptions, UseLoginReturn } from "../types";
import { useLoginActions } from "./use-login-actions";

export function useLogin(options?: UseLoginOptions): UseLoginReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(authReducer, createInitialState(options?.initialStep ?? "email"));
  const stateRef = useRef(state);
  stateRef.current = state;
  const callbacks = options?.callbacks;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs once on mount to recover login state
  useEffect(() => {
    if (options?.autoRecover === false) return;

    const { token, signInId: signInIdFromStorage, email } = authStorage.getState();
    const loginOptions = authStorage.getLoginOptions();

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

    if (email) dispatch({ type: "SET_EMAIL", email });
    if (loginOptions) dispatch({ type: "SET_LOGIN_OPTIONS", options: loginOptions });

    const storedStep = authStorage.getRecoverableStep();
    if (storedStep && isRecoverableStep(storedStep) && signInId) {
      dispatch({ type: "SET_SIGNIN_ID", signInId });
      dispatch({ type: "RECOVER_STATE", state: { step: storedStep as AuthStep } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginActions = useLoginActions({ client, stateRef, dispatch, callbacks });

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
    ...loginActions,
  };
}
