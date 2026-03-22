import type {
  CannotFinalizeError,
  CreateRegistrationPayload,
  GetPasskeyCreationOptionsResult,
  RegisterPasskeyPayload,
  RegistrationFlowResponse,
  RegistrationOptions,
  SendVerificationCodeResponse,
  UpdateRegistrationPayload,
} from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { authStorage } from "../../auth/auth-storage";
import { decodeSid } from "../../auth/helpers/jwt";
import {
  buildPublicKeyCreationOptions,
  formatCreationCredentialForServer,
  isWebAuthnSupported,
  PASSKEY_ERRORS,
} from "../../auth/passkey-utils";
import { getSocialAuthUrl } from "../../auth/social-auth";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { isRecord } from "../../utils";

type RegistrationErrorData = {
  meta?: {
    missing_fields?: string[];
  };
  error_details?: Record<string, string[]>;
};

function asRegistrationErrorData(data: unknown): RegistrationErrorData | null {
  if (!isRecord(data)) return null;
  return data as RegistrationErrorData;
}

type PasskeyCreationOptions = Extract<GetPasskeyCreationOptionsResult, [null, unknown]>[1];

interface State {
  registration: RegistrationFlowResponse | null;
  rid: string | null;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  missingFields: string[];
  cannotFinalize: CannotFinalizeError | null;
  enableResendAfter: number | null;
}

type Action =
  | { type: "start" }
  | { type: "set_registration"; registration: RegistrationFlowResponse; rid: string }
  | { type: "set_resend_after"; enableResendAfter: number }
  | { type: "set_rid"; rid: string }
  | { type: "error"; error: string; fieldErrors?: Record<string, string>; missingFields?: string[]; cannotFinalize?: CannotFinalizeError }
  | { type: "clear_errors" }
  | { type: "reset" };

const initialState: State = {
  registration: null,
  rid: null,
  isLoading: false,
  error: null,
  fieldErrors: {},
  missingFields: [],
  cannotFinalize: null,
  enableResendAfter: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, isLoading: true, error: null, fieldErrors: {}, missingFields: [], cannotFinalize: null };
    case "set_registration":
      return {
        ...state,
        isLoading: false,
        error: null,
        fieldErrors: {},
        missingFields: [],
        cannotFinalize: null,
        registration: action.registration,
        rid: action.rid,
      };
    case "set_resend_after":
      return { ...state, isLoading: false, error: null, enableResendAfter: action.enableResendAfter };
    case "set_rid":
      return { ...state, rid: action.rid };
    case "error":
      return {
        ...state,
        isLoading: false,
        error: action.error,
        fieldErrors: action.fieldErrors ?? {},
        missingFields: action.missingFields ?? [],
        cannotFinalize: action.cannotFinalize ?? null,
      };
    case "clear_errors":
      return { ...state, error: null, fieldErrors: {}, missingFields: [], cannotFinalize: null };
    case "reset":
      return initialState;
  }
}

function hydrateAuthFromRegistration(registration: RegistrationFlowResponse): void {
  const auth = registration.auth;
  if (!auth) return;

  authStorage.setToken(auth.id_token);
  authStorage.setRefreshToken(auth.refresh_token);
  authStorage.setRecoverableStep(null);
  authStorage.setMagicCodeStep(null);

  const signInId = decodeSid(auth.id_token);
  if (signInId) {
    authStorage.setSignInId(signInId);
  }

  if (registration.email) {
    authStorage.setEmail(registration.email);
  }
}

function extractFieldErrors(data: unknown): Record<string, string> {
  const errorData = asRegistrationErrorData(data);
  if (!errorData) return {};
  const details = errorData.error_details;
  if (!details) return {};

  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(details)) {
    fieldErrors[field] = messages.join(", ");
  }
  return fieldErrors;
}

function extractMissingFields(data: unknown): string[] {
  const errorData = asRegistrationErrorData(data);
  if (!errorData) return [];
  return errorData.meta?.missing_fields ?? [];
}

export interface UseRegistrationArgs {
  /** Optional registration id to start from. */
  initialRid?: string;
  /** Auto-read `registration_rid` from URL query params on mount. Default: true */
  autoRecoverRid?: boolean;
  callbacks?: HookCallbacks;
}

export interface RegisterPasskeyArgs {
  publicKeyCredential: RegisterPasskeyPayload["publicKeyCredential"];
  passkeyName?: string;
  options?: RegistrationOptions;
}

export interface CreateAndRegisterPasskeyArgs {
  passkeyName?: string;
  options?: RegistrationOptions;
}

export interface UseRegistrationReturn {
  registration: RegistrationFlowResponse | null;
  rid: string | null;
  isLoading: boolean;
  /** Whether finalization returned auth tokens and the session was hydrated. */
  isAuthenticated: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  missingFields: string[];
  cannotFinalize: CannotFinalizeError | null;
  enableResendAfter: number | null;
  createRegistration: (payload: CreateRegistrationPayload) => Promise<boolean>;
  getRegistration: (options?: RegistrationOptions) => Promise<boolean>;
  updateRegistration: (payload: UpdateRegistrationPayload, options?: RegistrationOptions) => Promise<boolean>;
  cancelRegistration: (options?: RegistrationOptions) => Promise<boolean>;
  finalizeRegistration: (options?: RegistrationOptions) => Promise<boolean>;
  sendEmailVerificationCode: (options?: RegistrationOptions) => Promise<{ success: boolean; data?: SendVerificationCodeResponse }>;
  verifyEmail: (code: string, options?: RegistrationOptions) => Promise<boolean>;
  sendResumeLink: (email: string) => Promise<boolean>;
  getPasskeyCreationOptions: (options?: RegistrationOptions) => Promise<PasskeyCreationOptions | null>;
  registerPasskey: (args: RegisterPasskeyArgs) => Promise<boolean>;
  createAndRegisterPasskey: (args?: CreateAndRegisterPasskeyArgs) => Promise<boolean>;
  removePasskey: (options?: RegistrationOptions) => Promise<boolean>;
  setRid: (rid: string) => void;
  clearErrors: () => void;
  reset: () => void;
}

export function useRegistration(args?: UseRegistrationArgs): UseRegistrationReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    rid: args?.initialRid ?? null,
  });

  const callbacksRef = useRef(args?.callbacks);
  callbacksRef.current = args?.callbacks;

  const resolveOptions = useCallback(
    (options?: RegistrationOptions): RegistrationOptions | undefined => {
      if (options?.rid) return options;
      if (state.rid) return { ...options, rid: state.rid };
      return options;
    },
    [state.rid],
  );

  useEffect(() => {
    if (args?.autoRecoverRid === false) return;
    if (state.rid) return;

    const urlRid = new URLSearchParams(window.location.search).get("registration_rid");
    if (urlRid) {
      dispatch({ type: "set_rid", rid: urlRid });
    }
  }, [args?.autoRecoverRid, state.rid]);

  const handleError = useCallback((errorCode: string, data: unknown) => {
    const fieldErrors = extractFieldErrors(data);
    const missingFields = extractMissingFields(data);
    const cannotFinalize = errorCode === "cannot_finalize" ? (data as CannotFinalizeError) : undefined;

    dispatch({ type: "error", error: errorCode, fieldErrors, missingFields, cannotFinalize });
    callbacksRef.current?.onError?.(errorCode);
  }, []);

  const createRegistration = useCallback(
    async (payload: CreateRegistrationPayload): Promise<boolean> => {
      dispatch({ type: "start" });
      const result = await client.auth.createRegistration(payload);
      const [errorCode, data] = result;
      if (errorCode === null) {
        dispatch({ type: "set_registration", registration: data, rid: data.rid });
        callbacksRef.current?.onSuccess?.("Registration created");
        return true;
      }

      handleError(errorCode, data);
      return false;
    },
    [client, handleError],
  );

  const getRegistration = useCallback(
    async (options?: RegistrationOptions): Promise<boolean> => {
      dispatch({ type: "start" });
      const result = await client.auth.getRegistration(resolveOptions(options));
      const [errorCode, data] = result;
      if (errorCode === null) {
        dispatch({ type: "set_registration", registration: data, rid: data.rid });
        return true;
      }

      handleError(errorCode, data);
      return false;
    },
    [client, handleError, resolveOptions],
  );

  const updateRegistration = useCallback(
    async (payload: UpdateRegistrationPayload, options?: RegistrationOptions): Promise<boolean> => {
      dispatch({ type: "start" });
      const result = await client.auth.updateRegistration(payload, resolveOptions(options));
      const [errorCode, data] = result;
      if (errorCode === null) {
        dispatch({ type: "set_registration", registration: data, rid: data.rid });
        callbacksRef.current?.onSuccess?.("Registration updated");
        return true;
      }

      handleError(errorCode, data);
      return false;
    },
    [client, handleError, resolveOptions],
  );

  const cancelRegistration = useCallback(
    async (options?: RegistrationOptions): Promise<boolean> => {
      dispatch({ type: "start" });
      const result = await client.auth.cancelRegistration(resolveOptions(options));
      const [errorCode] = result;
      if (errorCode === null) {
        dispatch({ type: "reset" });
        callbacksRef.current?.onSuccess?.("Registration cancelled");
        return true;
      }

      handleError(errorCode, result[1]);
      return false;
    },
    [client, handleError, resolveOptions],
  );

  const finalizeRegistration = useCallback(
    async (options?: RegistrationOptions): Promise<boolean> => {
      dispatch({ type: "start" });
      const result = await client.auth.finalizeRegistration(resolveOptions(options));
      const [errorCode, data] = result;
      if (errorCode === null) {
        hydrateAuthFromRegistration(data);
        dispatch({ type: "set_registration", registration: data, rid: data.rid });
        callbacksRef.current?.onSuccess?.("Registration finalized");
        return true;
      }

      handleError(errorCode, data);
      return false;
    },
    [client, handleError, resolveOptions],
  );

  const sendEmailVerificationCode = useCallback(
    async (options?: RegistrationOptions): Promise<{ success: boolean; data?: SendVerificationCodeResponse }> => {
      dispatch({ type: "start" });
      const result = await client.auth.sendEmailVerificationCode(resolveOptions(options));
      const [errorCode, data] = result;
      if (errorCode === null) {
        dispatch({ type: "set_resend_after", enableResendAfter: data.enable_resend_after });
        callbacksRef.current?.onSuccess?.("Verification code sent");
        return { success: true, data };
      }

      handleError(errorCode, data);
      return { success: false };
    },
    [client, handleError, resolveOptions],
  );

  const verifyEmail = useCallback(
    async (code: string, options?: RegistrationOptions): Promise<boolean> => {
      dispatch({ type: "start" });
      const result = await client.auth.verifyEmail({ code }, resolveOptions(options));
      const [errorCode, data] = result;
      if (errorCode === null) {
        dispatch({ type: "set_registration", registration: data, rid: data.rid });
        callbacksRef.current?.onSuccess?.("Email verified");
        return true;
      }

      handleError(errorCode, data);
      return false;
    },
    [client, handleError, resolveOptions],
  );

  const sendResumeLink = useCallback(
    async (email: string): Promise<boolean> => {
      dispatch({ type: "start" });
      const result = await client.auth.sendResumeLink({ email });
      const [errorCode, data] = result;
      if (errorCode === null) {
        dispatch({ type: "clear_errors" });
        callbacksRef.current?.onSuccess?.("Resume link sent");
        return true;
      }

      handleError(errorCode, data);
      return false;
    },
    [client, handleError],
  );

  const getPasskeyCreationOptions = useCallback(
    async (options?: RegistrationOptions): Promise<PasskeyCreationOptions | null> => {
      dispatch({ type: "start" });
      const result = await client.auth.getPasskeyCreationOptions(resolveOptions(options));
      const [errorCode, data] = result;
      if (errorCode === null) {
        dispatch({ type: "clear_errors" });
        return data;
      }

      handleError(errorCode, data);
      return null;
    },
    [client, handleError, resolveOptions],
  );

  const registerPasskey = useCallback(
    async ({ publicKeyCredential, passkeyName, options }: RegisterPasskeyArgs): Promise<boolean> => {
      dispatch({ type: "start" });
      const result = await client.auth.registerPasskey(
        {
          publicKeyCredential,
          passkey_name: passkeyName,
        },
        resolveOptions(options),
      );
      const [errorCode, data] = result;
      if (errorCode === null) {
        dispatch({ type: "set_registration", registration: data, rid: data.rid });
        callbacksRef.current?.onSuccess?.("Passkey registered");
        return true;
      }

      handleError(errorCode, data);
      return false;
    },
    [client, handleError, resolveOptions],
  );

  const createAndRegisterPasskey = useCallback(
    async (args?: CreateAndRegisterPasskeyArgs): Promise<boolean> => {
      if (!isWebAuthnSupported()) {
        dispatch({ type: "error", error: "passkey_not_supported" });
        callbacksRef.current?.onError?.("passkey_not_supported");
        return false;
      }

      dispatch({ type: "start" });

      try {
        const optionsResult = await client.auth.getPasskeyCreationOptions(resolveOptions(args?.options));
        const [optionsError, creationOptions] = optionsResult;
        if (optionsError || !creationOptions) {
          dispatch({ type: "error", error: optionsError || "bad_request" });
          callbacksRef.current?.onError?.(optionsError || "bad_request");
          return false;
        }

        const publicKeyOptions = buildPublicKeyCreationOptions(creationOptions);
        const credential = (await navigator.credentials.create({ publicKey: publicKeyOptions })) as PublicKeyCredential | null;

        if (!credential) {
          dispatch({ type: "error", error: "passkey_cancelled" });
          callbacksRef.current?.onError?.("passkey_cancelled");
          return false;
        }

        const formattedCredential = formatCreationCredentialForServer(credential);
        const result = await client.auth.registerPasskey(
          {
            publicKeyCredential: formattedCredential,
            passkey_name: args?.passkeyName,
          },
          resolveOptions(args?.options),
        );
        const [errorCode, data] = result;
        if (errorCode === null) {
          dispatch({ type: "set_registration", registration: data, rid: data.rid });
          callbacksRef.current?.onSuccess?.("Passkey registered");
          return true;
        }

        handleError(errorCode, data);
        return false;
      } catch (error) {
        let errorMessage = "passkey_error";
        if (error instanceof DOMException) {
          errorMessage = PASSKEY_ERRORS[error.name] || "passkey_error";
        }
        dispatch({ type: "error", error: errorMessage });
        callbacksRef.current?.onError?.(errorMessage);
        return false;
      }
    },
    [client, handleError, resolveOptions],
  );

  const removePasskey = useCallback(
    async (options?: RegistrationOptions): Promise<boolean> => {
      dispatch({ type: "start" });
      const result = await client.auth.removePasskey(resolveOptions(options));
      const [errorCode, data] = result;
      if (errorCode === null) {
        dispatch({ type: "set_registration", registration: data, rid: data.rid });
        callbacksRef.current?.onSuccess?.("Passkey removed");
        return true;
      }

      handleError(errorCode, data);
      return false;
    },
    [client, handleError, resolveOptions],
  );

  const setRid = useCallback((rid: string) => dispatch({ type: "set_rid", rid }), []);
  const clearErrors = useCallback(() => dispatch({ type: "clear_errors" }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return {
    registration: state.registration,
    rid: state.rid,
    isLoading: state.isLoading,
    isAuthenticated: !!state.registration?.auth,
    error: state.error,
    fieldErrors: state.fieldErrors,
    missingFields: state.missingFields,
    cannotFinalize: state.cannotFinalize,
    enableResendAfter: state.enableResendAfter,
    createRegistration,
    getRegistration,
    updateRegistration,
    cancelRegistration,
    finalizeRegistration,
    sendEmailVerificationCode,
    verifyEmail,
    sendResumeLink,
    getPasskeyCreationOptions,
    registerPasskey,
    createAndRegisterPasskey,
    removePasskey,
    setRid,
    clearErrors,
    reset,
  };
}
