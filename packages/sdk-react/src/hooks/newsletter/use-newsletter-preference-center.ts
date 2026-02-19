import type { NewsletterSubscription, NewsletterSubscriptionError } from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { currentPageUrl, runMutation } from "../../utils";

export interface ExistingSubscription {
  newsletter_internal_name: string;
  confirmed: boolean;
  preference_identifiers: string[];
}

function toExistingSubscription(sub: NewsletterSubscription): ExistingSubscription {
  return {
    newsletter_internal_name: sub.newsletter_internal_name,
    confirmed: sub.confirmed_at !== null,
    preference_identifiers: sub.preference_identifiers,
  };
}

interface State {
  subscriptions: ExistingSubscription[];
  email: string | undefined;
  isLoading: boolean;
  error: string | null;
  mutatingNewsletters: Set<string>;
  mutationError: string | null;
  preferenceToken: string | undefined;
}

type Action =
  | { type: "fetch_start" }
  | { type: "fetch_success"; subscriptions: ExistingSubscription[]; email?: string; preferenceToken?: string }
  | { type: "fetch_error"; error: string }
  | { type: "mutate_start"; internalName: string }
  | { type: "mutate_error"; internalName: string; error: string }
  | { type: "subscribe_success"; internalName: string; subscription: ExistingSubscription }
  | { type: "unsubscribe_success"; internalName: string; newPreferenceToken?: string }
  | { type: "update_success"; internalName: string; preferenceIdentifiers: string[] };

function withoutMutating(state: State, internalName: string): Set<string> {
  const next = new Set(state.mutatingNewsletters);
  next.delete(internalName);
  return next;
}

function withMutating(state: State, internalName: string): Set<string> {
  const next = new Set(state.mutatingNewsletters);
  next.add(internalName);
  return next;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch_start":
      return { ...state, isLoading: true, error: null };
    case "fetch_success":
      return {
        ...state,
        isLoading: false,
        error: null,
        subscriptions: action.subscriptions,
        email: action.email ?? state.email,
        preferenceToken: action.preferenceToken ?? state.preferenceToken,
      };
    case "fetch_error":
      return { ...state, isLoading: false, error: action.error, preferenceToken: undefined };
    case "mutate_start":
      return { ...state, mutatingNewsletters: withMutating(state, action.internalName), mutationError: null };
    case "mutate_error":
      return { ...state, mutatingNewsletters: withoutMutating(state, action.internalName), mutationError: action.error };
    case "subscribe_success":
      return {
        ...state,
        mutatingNewsletters: withoutMutating(state, action.internalName),
        mutationError: null,
        subscriptions: [...state.subscriptions, action.subscription],
      };
    case "unsubscribe_success":
      return {
        ...state,
        mutatingNewsletters: withoutMutating(state, action.internalName),
        mutationError: null,
        subscriptions: state.subscriptions.filter((s) => s.newsletter_internal_name !== action.internalName),
        preferenceToken: action.newPreferenceToken ?? undefined,
      };
    case "update_success":
      return {
        ...state,
        mutatingNewsletters: withoutMutating(state, action.internalName),
        mutationError: null,
        subscriptions: state.subscriptions.map((s) =>
          s.newsletter_internal_name === action.internalName ? { ...s, preference_identifiers: action.preferenceIdentifiers } : s,
        ),
      };
  }
}

export interface UseNewsletterPreferenceCenterArgs {
  preferenceToken?: string;
  callbacks?: HookCallbacks;
}

export interface UseNewsletterPreferenceCenterReturn {
  subscriptions: ExistingSubscription[];
  preferenceToken: string | undefined;
  isLoading: boolean;
  error: string | null;
  isMutating: (internalName: string) => boolean;
  mutationError: string | null;
  refetch: () => Promise<void>;
  subscribe: (internalName: string, preferenceIdentifiers?: string[]) => Promise<boolean>;
  unsubscribe: (internalName: string) => Promise<boolean>;
  updatePreferences: (internalName: string, preferenceIdentifiers: string[]) => Promise<boolean>;
}

export function useNewsletterPreferenceCenter(args?: UseNewsletterPreferenceCenterArgs): UseNewsletterPreferenceCenterReturn {
  const client = useUnidyClient();

  const [state, dispatch] = useReducer(reducer, {
    subscriptions: [],
    email: undefined,
    isLoading: true,
    error: null,
    mutatingNewsletters: new Set<string>(),
    mutationError: null,
    preferenceToken: args?.preferenceToken,
  });

  const tokenRef = useRef(state.preferenceToken);
  tokenRef.current = state.preferenceToken;

  const emailRef = useRef(state.email);
  emailRef.current = state.email;

  const callbacksRef = useRef(args?.callbacks);
  callbacksRef.current = args?.callbacks;

  const fetchSubscriptions = useCallback(async () => {
    dispatch({ type: "fetch_start" });

    const result = await client.newsletters.list({
      options: { preferenceToken: tokenRef.current },
    });

    const [errorCode, data] = result;

    if (errorCode === null) {
      const subscriptions = data.map(toExistingSubscription);
      const newToken = data[0]?.preference_token;
      const email = data[0]?.email;
      dispatch({ type: "fetch_success", subscriptions, email, preferenceToken: newToken });
    } else {
      dispatch({ type: "fetch_error", error: errorCode });
      callbacksRef.current?.onError?.(errorCode);
    }
  }, [client]);

  const didFetchRef = useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const subscribe = useCallback(
    (internalName: string, preferenceIdentifiers?: string[]) => {
      const resolvedEmail = emailRef.current || "";
      dispatch({ type: "mutate_start", internalName });
      return runMutation(
        () =>
          client.newsletters.create({
            payload: {
              email: resolvedEmail,
              newsletter_subscriptions: [{ newsletter_internal_name: internalName, preference_identifiers: preferenceIdentifiers }],
              redirect_to_after_confirmation: currentPageUrl(),
            },
            options: { preferenceToken: tokenRef.current },
          }),
        {
          onMutate: () => {},
          onSuccess: (data) => {
            if (data.errors.length > 0) {
              const errorMessage = data.errors.map((e: NewsletterSubscriptionError) => e.error_identifier).join(", ");
              dispatch({ type: "mutate_error", internalName, error: errorMessage });
              callbacksRef.current?.onError?.(errorMessage);
              return false;
            }
            const sub = data.results[0];
            if (sub) {
              dispatch({ type: "subscribe_success", internalName, subscription: toExistingSubscription(sub) });
            }
            callbacksRef.current?.onSuccess?.(`Subscribed to ${internalName}`);
          },
          onError: (error) => {
            dispatch({ type: "mutate_error", internalName, error });
            callbacksRef.current?.onError?.(error);
          },
        },
      );
    },
    [client],
  );

  const unsubscribe = useCallback(
    (internalName: string) => {
      dispatch({ type: "mutate_start", internalName });
      return runMutation(() => client.newsletters.delete({ internalName, options: { preferenceToken: tokenRef.current } }), {
        onMutate: () => {},
        onSuccess: (data) => {
          dispatch({ type: "unsubscribe_success", internalName, newPreferenceToken: data?.new_preference_token });
          callbacksRef.current?.onSuccess?.(`Unsubscribed from ${internalName}`);
        },
        onError: (error) => {
          dispatch({ type: "mutate_error", internalName, error });
          callbacksRef.current?.onError?.(error);
        },
      });
    },
    [client],
  );

  const updatePreferences = useCallback(
    (internalName: string, preferenceIdentifiers: string[]) => {
      dispatch({ type: "mutate_start", internalName });
      return runMutation(
        () =>
          client.newsletters.update({
            internalName,
            payload: { preference_identifiers: preferenceIdentifiers },
            options: { preferenceToken: tokenRef.current },
          }),
        {
          onMutate: () => {},
          onSuccess: () => {
            dispatch({ type: "update_success", internalName, preferenceIdentifiers });
            callbacksRef.current?.onSuccess?.(`Preferences updated for ${internalName}`);
          },
          onError: (error) => {
            dispatch({ type: "mutate_error", internalName, error });
            callbacksRef.current?.onError?.(error);
          },
        },
      );
    },
    [client],
  );

  const isMutating = useCallback((internalName: string) => state.mutatingNewsletters.has(internalName), [state.mutatingNewsletters]);

  return {
    subscriptions: state.subscriptions,
    preferenceToken: state.preferenceToken,
    isLoading: state.isLoading,
    error: state.error,
    isMutating,
    mutationError: state.mutationError,
    refetch: fetchSubscriptions,
    subscribe,
    unsubscribe,
    updatePreferences,
  };
}
