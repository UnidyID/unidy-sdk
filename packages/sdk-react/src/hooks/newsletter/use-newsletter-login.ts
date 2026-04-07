import { useCallback, useMemo, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { createMutationHandlers, runMutation } from "../../utils";

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

export interface UseNewsletterLoginArgs {
  callbacks?: HookCallbacks;
}

export interface UseNewsletterLoginReturn {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  sendLoginEmail: (email: string, redirectUri: string) => Promise<boolean>;
  reset: () => void;
}

export function useNewsletterLogin(args?: UseNewsletterLoginArgs): UseNewsletterLoginReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);

  const callbacksRef = useRef(args?.callbacks);
  callbacksRef.current = args?.callbacks;

  const mutation = useMemo(() => createMutationHandlers(dispatch, callbacksRef, "start", "error"), []);

  const sendLoginEmail = useCallback(
    (email: string, redirectUri: string) =>
      runMutation(() => client.newsletters.sendLoginEmail({ payload: { email, redirect_uri: redirectUri } }), {
        ...mutation,
        onSuccess: () => {
          dispatch({ type: "success" });
          callbacksRef.current?.onSuccess?.("Login email sent");
        },
      }),
    [client, mutation],
  );

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    success: state.success,
    sendLoginEmail,
    reset,
  };
}
