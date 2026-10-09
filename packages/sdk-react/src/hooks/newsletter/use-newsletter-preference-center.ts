import type {
  ApiErrorDetail,
  MeNewsletterSubscription,
  NewsletterSubscription,
  NewsletterSubscriptionError,
} from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { currentPageUrl, runMutation } from "../../utils";

export interface ExistingSubscription {
  newsletter_internal_name: string;
  confirmed: boolean;
  preference_identifiers: string[];
}

function toExistingSubscription(sub: NewsletterSubscription | MeNewsletterSubscription): ExistingSubscription {
  return {
    newsletter_internal_name: "newsletter_slug" in sub ? sub.newsletter_slug : sub.newsletter_internal_name,
    confirmed: sub.confirmed_at !== null,
    preference_identifiers: sub.preference_identifiers,
  };
}

/** The V2 error details of a failed signed-in call; V1 errors carry none. */
function errorDetails(data: unknown): ApiErrorDetail[] {
  return data && typeof data === "object" && "details" in data && Array.isArray(data.details) ? data.details : [];
}

interface State {
  subscriptions: ExistingSubscription[];
  email: string | undefined;
  isLoading: boolean;
  error: string | null;
  mutatingNewsletters: Set<string>;
  mutationError: string | null;
  mutationErrorDetails: ApiErrorDetail[];
  preferenceToken: string | undefined;
}

type Action =
  | { type: "fetch_start" }
  | { type: "fetch_success"; subscriptions: ExistingSubscription[]; email?: string; preferenceToken?: string }
  | { type: "fetch_error"; error: string }
  | { type: "mutate_start"; internalName: string }
  | { type: "mutate_error"; internalName: string; error: string; details: ApiErrorDetail[] }
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
      return { ...state, mutatingNewsletters: withMutating(state, action.internalName), mutationError: null, mutationErrorDetails: [] };
    case "mutate_error":
      return {
        ...state,
        mutatingNewsletters: withoutMutating(state, action.internalName),
        mutationError: action.error,
        mutationErrorDetails: action.details,
      };
    case "subscribe_success":
      return {
        ...state,
        mutatingNewsletters: withoutMutating(state, action.internalName),
        mutationError: null,
        mutationErrorDetails: [],
        subscriptions: [...state.subscriptions, action.subscription],
      };
    case "unsubscribe_success":
      return {
        ...state,
        mutatingNewsletters: withoutMutating(state, action.internalName),
        mutationError: null,
        mutationErrorDetails: [],
        subscriptions: state.subscriptions.filter((s) => s.newsletter_internal_name !== action.internalName),
        preferenceToken: action.newPreferenceToken ?? undefined,
      };
    case "update_success":
      return {
        ...state,
        mutatingNewsletters: withoutMutating(state, action.internalName),
        mutationError: null,
        mutationErrorDetails: [],
        subscriptions: state.subscriptions.map((s) =>
          s.newsletter_internal_name === action.internalName ? { ...s, preference_identifiers: action.preferenceIdentifiers } : s,
        ),
      };
  }
}

export interface UseNewsletterPreferenceCenterArgs {
  /**
   * Manages the subscriptions this preference token grants access to (`/api/sdk/v1`). Without one, the hook
   * manages the signed-in user's own subscriptions (`/api/v2/me`).
   */
  preferenceToken?: string;
  callbacks?: HookCallbacks;
}

export interface UseNewsletterPreferenceCenterReturn {
  subscriptions: ExistingSubscription[];
  preferenceToken: string | undefined;
  isLoading: boolean;
  error: string | null;
  isMutating: (internalName: string) => boolean;
  /** The error identifier of the last failed mutation: a V2 identifier (e.g. `unprocessable_content`) when signed in. */
  mutationError: string | null;
  /** The V2 error details of the last failed signed-in mutation, e.g. `{ field: "payload.data.newsletter_id", code: "taken" }`. */
  mutationErrorDetails: ApiErrorDetail[];
  refetch: () => Promise<void>;
  subscribe: (internalName: string, preferenceIdentifiers?: string[]) => Promise<boolean>;
  unsubscribe: (internalName: string) => Promise<boolean>;
  updatePreferences: (internalName: string, preferenceIdentifiers: string[]) => Promise<boolean>;
  /** Get the subscription for a given newsletter, or undefined if not subscribed. */
  getSubscription: (internalName: string) => ExistingSubscription | undefined;
  /** Check if the user is subscribed to a given newsletter. */
  isSubscribed: (internalName: string) => boolean;
  /**
   * Toggle a preference within a newsletter. Handles subscribe/unsubscribe/update
   * automatically based on the current state:
   * - If the preference is on and it's the last one, unsubscribes from the newsletter.
   * - If the preference is off and the newsletter isn't subscribed, subscribes with this preference.
   * - Otherwise, updates the preference list.
   * @param internalName - The newsletter internal name
   * @param preferenceId - The preference to toggle
   * @param allPreferenceIds - All valid preference IDs for this newsletter (needed to detect full/empty sets)
   */
  togglePreference: (internalName: string, preferenceId: string, allPreferenceIds: string[]) => Promise<boolean>;
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
    mutationErrorDetails: [],
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

    if (!tokenRef.current) {
      const [errorCode, data] = await client.newsletters.me.listAll();
      if (errorCode === null) {
        dispatch({ type: "fetch_success", subscriptions: data.map(toExistingSubscription), email: data[0]?.email });
      } else {
        dispatch({ type: "fetch_error", error: errorCode });
        callbacksRef.current?.onError?.(errorCode);
      }
      return;
    }

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

  const failMutation = useCallback((internalName: string, error: string, data?: unknown) => {
    dispatch({ type: "mutate_error", internalName, error, details: errorDetails(data) });
    callbacksRef.current?.onError?.(error);
  }, []);

  const subscribe = useCallback(
    (internalName: string, preferenceIdentifiers?: string[]) => {
      dispatch({ type: "mutate_start", internalName });
      const onSubscribed = (subscription: ExistingSubscription) => {
        dispatch({ type: "subscribe_success", internalName, subscription });
        callbacksRef.current?.onSuccess?.(`Subscribed to ${internalName}`);
      };

      if (!tokenRef.current) {
        return runMutation(
          () => client.newsletters.me.create({ slug: internalName, preferenceIdentifiers, redirectToAfterConfirmation: currentPageUrl() }),
          {
            onMutate: () => {},
            onSuccess: (data) => onSubscribed(toExistingSubscription(data)),
            onError: (error, data) => failMutation(internalName, error, data),
          },
        );
      }

      const resolvedEmail = emailRef.current || "";
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
              failMutation(internalName, data.errors.map((e: NewsletterSubscriptionError) => e.error_identifier).join(", "));
              return false;
            }
            const sub = data.results[0];
            if (sub) {
              onSubscribed(toExistingSubscription(sub));
            } else {
              callbacksRef.current?.onSuccess?.(`Subscribed to ${internalName}`);
            }
          },
          onError: (error) => failMutation(internalName, error),
        },
      );
    },
    [client, failMutation],
  );

  const unsubscribe = useCallback(
    (internalName: string) => {
      dispatch({ type: "mutate_start", internalName });
      const onUnsubscribed = (newPreferenceToken?: string) => {
        dispatch({ type: "unsubscribe_success", internalName, newPreferenceToken });
        callbacksRef.current?.onSuccess?.(`Unsubscribed from ${internalName}`);
      };

      if (!tokenRef.current) {
        return runMutation(() => client.newsletters.me.delete({ slug: internalName }), {
          onMutate: () => {},
          onSuccess: () => onUnsubscribed(),
          onError: (error, data) => failMutation(internalName, error, data),
        });
      }

      return runMutation(() => client.newsletters.delete({ internalName, options: { preferenceToken: tokenRef.current } }), {
        onMutate: () => {},
        onSuccess: (data) => onUnsubscribed(data?.new_preference_token),
        onError: (error) => failMutation(internalName, error),
      });
    },
    [client, failMutation],
  );

  const updatePreferences = useCallback(
    (internalName: string, preferenceIdentifiers: string[]) => {
      dispatch({ type: "mutate_start", internalName });
      const onUpdated = () => {
        dispatch({ type: "update_success", internalName, preferenceIdentifiers });
        callbacksRef.current?.onSuccess?.(`Preferences updated for ${internalName}`);
      };

      if (!tokenRef.current) {
        return runMutation(() => client.newsletters.me.update({ slug: internalName, preferenceIdentifiers }), {
          onMutate: () => {},
          onSuccess: onUpdated,
          onError: (error, data) => failMutation(internalName, error, data),
        });
      }

      return runMutation(
        () =>
          client.newsletters.update({
            internalName,
            payload: { preference_identifiers: preferenceIdentifiers },
            options: { preferenceToken: tokenRef.current },
          }),
        {
          onMutate: () => {},
          onSuccess: onUpdated,
          onError: (error) => failMutation(internalName, error),
        },
      );
    },
    [client, failMutation],
  );

  const isMutating = useCallback((internalName: string) => state.mutatingNewsletters.has(internalName), [state.mutatingNewsletters]);

  const getSubscription = useCallback(
    (internalName: string) => state.subscriptions.find((s) => s.newsletter_internal_name === internalName),
    [state.subscriptions],
  );

  const isSubscribedFn = useCallback(
    (internalName: string) => state.subscriptions.some((s) => s.newsletter_internal_name === internalName),
    [state.subscriptions],
  );

  const togglePreference = useCallback(
    async (internalName: string, preferenceId: string, allPreferenceIds: string[]): Promise<boolean> => {
      const sub = state.subscriptions.find((s) => s.newsletter_internal_name === internalName);

      // If not subscribed, subscribe with just this preference
      if (!sub) {
        return subscribe(internalName, [preferenceId]);
      }

      // Don't allow toggling if subscription is unconfirmed
      if (!sub.confirmed) return false;

      const currentIds = sub.preference_identifiers.length > 0 ? sub.preference_identifiers : allPreferenceIds;
      const isSelected = currentIds.includes(preferenceId);

      const newIds = isSelected ? currentIds.filter((id) => id !== preferenceId) : [...currentIds, preferenceId];

      if (newIds.length === 0) {
        return unsubscribe(internalName);
      }

      return updatePreferences(internalName, newIds);
    },
    [state.subscriptions, subscribe, unsubscribe, updatePreferences],
  );

  return {
    subscriptions: state.subscriptions,
    preferenceToken: state.preferenceToken,
    isLoading: state.isLoading,
    error: state.error,
    isMutating,
    mutationError: state.mutationError,
    mutationErrorDetails: state.mutationErrorDetails,
    refetch: fetchSubscriptions,
    subscribe,
    unsubscribe,
    updatePreferences,
    getSubscription,
    isSubscribed: isSubscribedFn,
    togglePreference,
  };
}
