import type { CreateSubscriptionsPayload, CreateSubscriptionsResponse, NewsletterSubscriptionError } from "@unidy.io/sdk/standalone";
import { useCallback, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { currentPageUrl } from "../../utils";

interface State {
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

type Action =
  | { type: "start" }
  | { type: "success" }
  | { type: "error"; error: string; fieldErrors?: Record<string, string> }
  | { type: "reset" };

const initialState: State = {
  isLoading: false,
  error: null,
  fieldErrors: {},
};

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { isLoading: true, error: null, fieldErrors: {} };
    case "success":
      return { isLoading: false, error: null, fieldErrors: {} };
    case "error":
      return { isLoading: false, error: action.error, fieldErrors: action.fieldErrors ?? {} };
    case "reset":
      return initialState;
  }
}

function extractFieldErrors(errors: NewsletterSubscriptionError[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const err of errors) {
    if (err.error_details) {
      for (const [field, messages] of Object.entries(err.error_details)) {
        fieldErrors[field] = messages.join(", ");
      }
    }
  }
  return fieldErrors;
}

export interface UseNewsletterSubscribeArgs {
  callbacks?: HookCallbacks;
}

export interface SubscribeArgs {
  email: string;
  newsletters: { internalName: string; preferenceIdentifiers?: string[] }[];
  additionalFields?: CreateSubscriptionsPayload["additional_fields"];
  redirectToAfterConfirmation?: string;
}

export interface UseNewsletterSubscribeReturn {
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  subscribe: (args: SubscribeArgs) => Promise<{ success: boolean; data?: CreateSubscriptionsResponse }>;
  reset: () => void;
}

export function useNewsletterSubscribe(args?: UseNewsletterSubscribeArgs): UseNewsletterSubscribeReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);

  const callbacksRef = useRef(args?.callbacks);
  callbacksRef.current = args?.callbacks;

  const subscribe = useCallback(
    async (subscribeArgs: SubscribeArgs): Promise<{ success: boolean; data?: CreateSubscriptionsResponse }> => {
      dispatch({ type: "start" });

      const payload: CreateSubscriptionsPayload = {
        email: subscribeArgs.email,
        newsletter_subscriptions: subscribeArgs.newsletters.map((n) => ({
          newsletter_internal_name: n.internalName,
          preference_identifiers: n.preferenceIdentifiers,
        })),
        additional_fields: subscribeArgs.additionalFields,
        redirect_to_after_confirmation: subscribeArgs.redirectToAfterConfirmation ?? currentPageUrl(),
      };

      const result = await client.newsletters.create({ payload });
      const [errorCode, data] = result;

      if (errorCode === null) {
        // Success - but may contain per-subscription errors
        if (data.errors.length > 0) {
          const fieldErrors = extractFieldErrors(data.errors);
          const errorMessage = data.errors.map((e: NewsletterSubscriptionError) => e.error_identifier).join(", ");
          dispatch({ type: "error", error: errorMessage, fieldErrors });
          callbacksRef.current?.onError?.(errorMessage);
          return { success: false, data };
        }

        dispatch({ type: "success" });
        callbacksRef.current?.onSuccess?.("Subscribed successfully");
        return { success: true, data };
      }

      if (errorCode === "newsletter_error") {
        // 422 with CreateSubscriptionsResponse containing errors
        const fieldErrors = extractFieldErrors(data.errors);
        const errorMessage = data.errors.map((e: NewsletterSubscriptionError) => e.error_identifier).join(", ");
        dispatch({ type: "error", error: errorMessage, fieldErrors });
        callbacksRef.current?.onError?.(errorMessage);
        return { success: false, data };
      }

      // Other errors (connection_failed, unauthorized, rate_limit_exceeded, etc.)
      dispatch({ type: "error", error: errorCode });
      callbacksRef.current?.onError?.(errorCode);
      return { success: false };
    },
    [client],
  );

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    fieldErrors: state.fieldErrors,
    subscribe,
    reset,
  };
}
