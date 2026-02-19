import type { UserProfileData, UserProfileFormError } from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { runMutation } from "../../utils";

interface State {
  profile: UserProfileData | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

type Action =
  | { type: "fetch_start" }
  | { type: "fetch_success"; profile: UserProfileData }
  | { type: "fetch_error"; error: string }
  | { type: "update_start" }
  | { type: "update_success"; profile: UserProfileData }
  | { type: "update_error"; error: string; fieldErrors?: Record<string, string> }
  | { type: "clear_errors" };

const initialState: State = {
  profile: null,
  isLoading: false,
  isMutating: false,
  error: null,
  fieldErrors: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch_start":
      return { ...state, isLoading: true, error: null };
    case "fetch_success":
      return { ...state, isLoading: false, error: null, profile: action.profile, fieldErrors: {} };
    case "fetch_error":
      return { ...state, isLoading: false, error: action.error };
    case "update_start":
      return { ...state, isMutating: true, error: null, fieldErrors: {} };
    case "update_success":
      return { ...state, isMutating: false, error: null, profile: action.profile, fieldErrors: {} };
    case "update_error":
      return { ...state, isMutating: false, error: action.error, fieldErrors: action.fieldErrors ?? {} };
    case "clear_errors":
      return { ...state, error: null, fieldErrors: {} };
  }
}

function extractFieldErrors(formError: UserProfileFormError): Record<string, string> {
  return formError.flatErrors ?? {};
}

export interface UseProfileOptions {
  /** Fetch on mount when authenticated. Default: true */
  fetchOnMount?: boolean;
  /** Only validate these fields on update (partial validation) */
  fields?: string[];
  callbacks?: HookCallbacks;
}

export interface UseProfileReturn {
  profile: UserProfileData | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  updateProfile: (data: Record<string, unknown>) => Promise<boolean>;
  refetch: () => Promise<void>;
  clearErrors: () => void;
}

export function useProfile(options?: UseProfileOptions): UseProfileReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const fetchOnMount = options?.fetchOnMount;

  const fetchProfile = useCallback(async () => {
    dispatch({ type: "fetch_start" });

    const result = await client.profile.get();
    const [errorCode, data] = result;

    if (errorCode === null) {
      dispatch({ type: "fetch_success", profile: data as UserProfileData });
    } else {
      dispatch({ type: "fetch_error", error: errorCode });
      optionsRef.current?.callbacks?.onError?.(errorCode);
    }
  }, [client]);

  useEffect(() => {
    if (fetchOnMount !== false) {
      void fetchProfile();
    }
  }, [fetchProfile, fetchOnMount]);

  const updateProfile = useCallback(
    (data: Record<string, unknown>): Promise<boolean> => {
      const payload: Record<string, unknown> = { ...data };

      // Add partial validation flag if fields are specified
      if (optionsRef.current?.fields?.length) {
        payload._validate_only_sent_fields = true;
      }

      return runMutation(() => client.profile.update({ payload }), {
        onMutate: () => dispatch({ type: "update_start" }),
        onSuccess: (profile) => {
          dispatch({ type: "update_success", profile: profile as UserProfileData });
          optionsRef.current?.callbacks?.onSuccess?.("Profile updated successfully");
        },
        onError: (errorCode, responseData) => {
          if (errorCode === "validation_error") {
            const fieldErrors = extractFieldErrors(responseData as UserProfileFormError);
            dispatch({ type: "update_error", error: errorCode, fieldErrors });
          } else {
            dispatch({ type: "update_error", error: errorCode });
          }
          optionsRef.current?.callbacks?.onError?.(errorCode);
        },
      });
    },
    [client],
  );

  const clearErrors = useCallback(() => {
    dispatch({ type: "clear_errors" });
  }, []);

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    isMutating: state.isMutating,
    error: state.error,
    fieldErrors: state.fieldErrors,
    updateProfile,
    refetch: fetchProfile,
    clearErrors,
  };
}
