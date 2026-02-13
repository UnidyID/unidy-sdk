import { useCallback, useMemo, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { createMutationHandlers, currentPageUrl, runMutation } from "../../utils";

interface State {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

type Action = { type: "start" } | { type: "success" } | { type: "error"; error: string } | { type: "reset" };

const initialState: State = { isLoading: false, error: null, success: false };

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { isLoading: true, error: null, success: false };
    case "success":
      return { isLoading: false, error: null, success: true };
    case "error":
      return { isLoading: false, error: action.error, success: false };
    case "reset":
      return initialState;
  }
}

export interface UseNewsletterResendConfirmationArgs {
  preferenceToken?: string;
  callbacks?: HookCallbacks;
}

export interface UseNewsletterResendConfirmationReturn {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  resendConfirmation: (internalName: string, redirectToAfterConfirmation?: string) => Promise<boolean>;
  reset: () => void;
}

export function useNewsletterResendConfirmation(args?: UseNewsletterResendConfirmationArgs): UseNewsletterResendConfirmationReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);

  const callbacksRef = useRef(args?.callbacks);
  callbacksRef.current = args?.callbacks;

  const preferenceTokenRef = useRef(args?.preferenceToken);
  preferenceTokenRef.current = args?.preferenceToken;

  const mutation = useMemo(() => createMutationHandlers(dispatch, callbacksRef, "start", "error"), []);

  const resendConfirmation = useCallback(
    (internalName: string, redirectToAfterConfirmation?: string) => {
      const redirectUrl = redirectToAfterConfirmation ?? currentPageUrl();
      return runMutation(
        () =>
          client.newsletters.resendDoi({
            internalName,
            payload: { redirect_to_after_confirmation: redirectUrl },
            options: { preferenceToken: preferenceTokenRef.current },
          }),
        {
          ...mutation,
          onSuccess: () => {
            dispatch({ type: "success" });
            callbacksRef.current?.onSuccess?.("Confirmation email resent");
          },
        },
      );
    },
    [client, mutation],
  );

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    success: state.success,
    resendConfirmation,
    reset,
  };
}
