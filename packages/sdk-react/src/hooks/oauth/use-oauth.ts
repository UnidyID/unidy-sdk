import type {
  CheckConsentResponse,
  ConnectRequest,
  GrantConsentRequest,
  OAuthTokenResponse,
  UpdateConsentRequest,
} from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";

export interface UseOAuthOptions {
  clientId: string;
  /** Auto-check consent on mount. Default: true */
  autoCheck?: boolean;
  callbacks?: HookCallbacks;
}

export interface UseOAuthReturn {
  consent: CheckConsentResponse | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, unknown>;
  checkConsent: () => Promise<boolean>;
  updateConsent: (request: UpdateConsentRequest) => Promise<boolean>;
  grantConsent: (request?: GrantConsentRequest) => Promise<boolean>;
  connect: (request?: ConnectRequest) => Promise<boolean>;
}

interface State {
  consent: CheckConsentResponse | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, unknown>;
}

type Action =
  | { type: "start" }
  | { type: "set_consent"; consent: CheckConsentResponse }
  | { type: "set_token"; token: string }
  | { type: "error"; error: string; fieldErrors?: Record<string, unknown> }
  | { type: "clear_errors" };

const initialState: State = {
  consent: null,
  token: null,
  isLoading: false,
  error: null,
  fieldErrors: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, isLoading: true, error: null, fieldErrors: {} };
    case "set_consent":
      return { ...state, isLoading: false, consent: action.consent, error: null, fieldErrors: {} };
    case "set_token":
      return { ...state, isLoading: false, token: action.token, error: null, fieldErrors: {} };
    case "error":
      return { ...state, isLoading: false, error: action.error, fieldErrors: action.fieldErrors ?? {} };
    case "clear_errors":
      return { ...state, error: null, fieldErrors: {} };
  }
}

export function useOAuth(options: UseOAuthOptions): UseOAuthReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const callbacksRef = useRef(options.callbacks);
  callbacksRef.current = options.callbacks;

  const { clientId } = options;

  const checkConsent = useCallback(async (): Promise<boolean> => {
    dispatch({ type: "start" });
    const [errorCode, data] = await client.oauth.checkConsent(clientId);
    if (errorCode === null) {
      dispatch({ type: "set_consent", consent: data as CheckConsentResponse });
      callbacksRef.current?.onSuccess?.("Consent checked");
      return true;
    }
    dispatch({ type: "error", error: errorCode });
    callbacksRef.current?.onError?.(errorCode);
    return false;
  }, [client, clientId]);

  const autoCheck = options.autoCheck;
  useEffect(() => {
    if (autoCheck !== false) {
      void checkConsent();
    }
  }, [checkConsent, autoCheck]);

  const updateConsent = useCallback(
    async (request: UpdateConsentRequest): Promise<boolean> => {
      dispatch({ type: "start" });
      const [errorCode, data] = await client.oauth.updateConsent(clientId, request);
      if (errorCode === null) {
        dispatch({ type: "set_consent", consent: data as CheckConsentResponse });
        callbacksRef.current?.onSuccess?.("Consent updated");
        return true;
      }
      const fieldErrors =
        errorCode === "invalid_user_updates" && data && typeof data === "object" && "error_details" in data
          ? ((data as { error_details?: Record<string, unknown> }).error_details ?? {})
          : {};
      dispatch({ type: "error", error: errorCode, fieldErrors });
      callbacksRef.current?.onError?.(errorCode);
      return false;
    },
    [client, clientId],
  );

  const grantConsent = useCallback(
    async (request?: GrantConsentRequest): Promise<boolean> => {
      dispatch({ type: "start" });
      const [errorCode, data] = await client.oauth.grantConsent(clientId, request);
      if (errorCode === null) {
        const tokenResponse = data as OAuthTokenResponse;
        dispatch({ type: "set_token", token: tokenResponse.token });
        callbacksRef.current?.onSuccess?.("Consent granted");
        return true;
      }
      const fieldErrors =
        errorCode === "missing_required_fields" && data && typeof data === "object" && "error_details" in data
          ? ((data as { error_details?: Record<string, unknown> }).error_details ?? {})
          : {};
      dispatch({ type: "error", error: errorCode, fieldErrors });
      callbacksRef.current?.onError?.(errorCode);
      return false;
    },
    [client, clientId],
  );

  const connect = useCallback(
    async (request?: ConnectRequest): Promise<boolean> => {
      dispatch({ type: "start" });
      const [errorCode, data] = await client.oauth.connect(clientId, request);
      if (errorCode === null) {
        const tokenResponse = data as OAuthTokenResponse;
        dispatch({ type: "set_token", token: tokenResponse.token });
        callbacksRef.current?.onSuccess?.("Connected");
        return true;
      }
      if (errorCode === "consent_not_granted") {
        const consentData = data as CheckConsentResponse;
        dispatch({ type: "set_consent", consent: consentData });
        return false;
      }
      if (errorCode === "missing_required_fields") {
        const consentData = data as CheckConsentResponse;
        dispatch({ type: "set_consent", consent: consentData });
        const fieldErrors =
          data && typeof data === "object" && "error_details" in data
            ? ((data as { error_details?: Record<string, unknown> }).error_details ?? {})
            : {};
        dispatch({ type: "error", error: errorCode, fieldErrors });
        callbacksRef.current?.onError?.(errorCode);
        return false;
      }
      dispatch({ type: "error", error: errorCode });
      callbacksRef.current?.onError?.(errorCode);
      return false;
    },
    [client, clientId],
  );

  return {
    consent: state.consent,
    token: state.token,
    isLoading: state.isLoading,
    error: state.error,
    fieldErrors: state.fieldErrors,
    checkConsent,
    updateConsent,
    grantConsent,
    connect,
  };
}
