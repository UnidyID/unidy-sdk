import { type MeUser, type MeUserUpdate, type ProfileField, profileFieldErrors } from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { runMutation } from "../../utils";

interface State {
  profile: MeUser | null;
  fields: ProfileField[] | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

type Action =
  | { type: "fetch_start" }
  | { type: "fetch_success"; profile: MeUser; fields: ProfileField[] | null }
  | { type: "fetch_error"; error: string }
  | { type: "update_start" }
  | { type: "update_success"; profile: MeUser }
  | { type: "update_error"; error: string; fieldErrors: Record<string, string> }
  | { type: "fields_success"; fields: ProfileField[] }
  | { type: "clear_errors" };

const initialState: State = {
  profile: null,
  fields: null,
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
      return { ...state, isLoading: false, error: null, profile: action.profile, fields: action.fields, fieldErrors: {} };
    case "fetch_error":
      return { ...state, isLoading: false, error: action.error };
    case "update_start":
      return { ...state, isMutating: true, error: null, fieldErrors: {} };
    case "update_success":
      return { ...state, isMutating: false, error: null, profile: action.profile, fieldErrors: {} };
    case "update_error":
      return { ...state, isMutating: false, error: action.error, fieldErrors: action.fieldErrors };
    case "fields_success":
      return { ...state, fields: action.fields };
    case "clear_errors":
      return { ...state, error: null, fieldErrors: {} };
  }
}

function fieldValue(user: MeUser, field: ProfileField): unknown {
  return field.custom_attribute ? user.custom_attributes[field.name] : user[field.name as keyof MeUser];
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

/** A brand's lock applies to a field once it holds a value, so filling an empty field can lock it. */
function filledEmptyField(before: MeUser, after: MeUser, fields: ProfileField[]): boolean {
  return fields.some((field) => isEmpty(fieldValue(before, field)) && !isEmpty(fieldValue(after, field)));
}

export interface UseProfileOptions {
  /** Fetch on mount when authenticated. Default: true */
  fetchOnMount?: boolean;
  /** Also fetch the profile form (`fields`): labels, input types, options, and which fields are required, read-only or locked. Default: true */
  fetchFields?: boolean;
  /** Only validate these fields on update (partial validation) */
  fields?: string[];
  callbacks?: HookCallbacks;
}

export interface UseProfileReturn {
  /** The signed-in user. */
  profile: MeUser | null;
  /** The profile form in display order; each field's value is on `profile` under its `name` (or `custom_attributes[name]`). */
  fields: ProfileField[] | null;
  isLoading: boolean;
  isMutating: boolean;
  /** The error identifier of the last failed call, e.g. `unprocessable_content`. */
  error: string | null;
  /** Messages of a failed update by field, e.g. `first_name` or `custom_attributes.tier`. */
  fieldErrors: Record<string, string>;
  /** Writes profile fields. A `null` value clears the field. */
  updateProfile: (data: MeUserUpdate) => Promise<boolean>;
  refetch: () => Promise<void>;
  clearErrors: () => void;
}

export function useProfile(options?: UseProfileOptions): UseProfileReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const stateRef = useRef(state);
  stateRef.current = state;
  const fetchOnMount = options?.fetchOnMount;

  const fetchProfile = useCallback(async () => {
    dispatch({ type: "fetch_start" });

    const withFields = optionsRef.current?.fetchFields !== false;
    const [profileResult, fieldsResult] = await Promise.all([client.profile.get(), withFields ? client.profile.fields() : null]);

    const errorCode = profileResult[0] ?? fieldsResult?.[0] ?? null;
    if (errorCode !== null) {
      dispatch({ type: "fetch_error", error: errorCode });
      optionsRef.current?.callbacks?.onError?.(errorCode);
      return;
    }

    dispatch({ type: "fetch_success", profile: profileResult[1] as MeUser, fields: (fieldsResult?.[1] as ProfileField[]) ?? null });
  }, [client]);

  useEffect(() => {
    if (fetchOnMount !== false) {
      void fetchProfile();
    }
  }, [fetchProfile, fetchOnMount]);

  const refetchFields = useCallback(async () => {
    const [errorCode, fields] = await client.profile.fields();
    if (errorCode === null) dispatch({ type: "fields_success", fields });
  }, [client]);

  const updateProfile = useCallback(
    (data: MeUserUpdate): Promise<boolean> => {
      const payload = optionsRef.current?.fields?.length ? { data, validate_only_sent_fields: true } : { data };

      return runMutation(() => client.profile.update({ payload }), {
        onMutate: () => dispatch({ type: "update_start" }),
        onSuccess: (profile) => {
          const { profile: before, fields } = stateRef.current;
          dispatch({ type: "update_success", profile });
          if (before && fields && filledEmptyField(before, profile, fields)) void refetchFields();
          optionsRef.current?.callbacks?.onSuccess?.("Profile updated successfully");
        },
        onError: (errorCode, errorData) => {
          const fieldErrors = errorData && "details" in errorData ? profileFieldErrors(errorData) : {};
          dispatch({ type: "update_error", error: errorCode, fieldErrors });
          optionsRef.current?.callbacks?.onError?.(errorCode);
        },
      });
    },
    [client, refetchFields],
  );

  const clearErrors = useCallback(() => {
    dispatch({ type: "clear_errors" });
  }, []);

  return {
    profile: state.profile,
    fields: state.fields,
    isLoading: state.isLoading,
    isMutating: state.isMutating,
    error: state.error,
    fieldErrors: state.fieldErrors,
    updateProfile,
    refetch: fetchProfile,
    clearErrors,
  };
}
