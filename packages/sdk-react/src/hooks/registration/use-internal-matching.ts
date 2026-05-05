import type { InternalMatchingConfig, InternalMatchResult } from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";

export interface UseInternalMatchingOptions {
  rid: string;
  /** Auto-fetch matching config on mount. Default: true */
  autoFetchConfig?: boolean;
  callbacks?: HookCallbacks;
}

export type CheckMatchOutcome = "found" | "not_found" | "error";
export type ConfirmMatchOutcome = "ok" | "not_found" | "mismatch" | "error";
export type SkipMatchOutcome = "ok" | "expired" | "error";

export interface UseInternalMatchingReturn {
  config: InternalMatchingConfig | null;
  matchResult: InternalMatchResult | null;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<boolean>;
  checkMatch: (matchingValue: string, additionalAttributes?: Record<string, string>) => Promise<CheckMatchOutcome>;
  confirmMatch: (matchingUserId: string | number) => Promise<ConfirmMatchOutcome>;
  skipMatch: () => Promise<SkipMatchOutcome>;
}

interface State {
  config: InternalMatchingConfig | null;
  matchResult: InternalMatchResult | null;
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: "start" }
  | { type: "set_config"; config: InternalMatchingConfig }
  | { type: "set_match"; matchResult: InternalMatchResult }
  | { type: "clear_match" }
  | { type: "success" }
  | { type: "error"; error: string };

const initialState: State = {
  config: null,
  matchResult: null,
  isLoading: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, isLoading: true, error: null };
    case "set_config":
      return { ...state, isLoading: false, config: action.config, error: null };
    case "set_match":
      return { ...state, isLoading: false, matchResult: action.matchResult, error: null };
    case "clear_match":
      return { ...state, isLoading: false, matchResult: null, error: null };
    case "success":
      return { ...state, isLoading: false, error: null };
    case "error":
      return { ...state, isLoading: false, error: action.error };
  }
}

export function useInternalMatching(options: UseInternalMatchingOptions): UseInternalMatchingReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const callbacksRef = useRef(options.callbacks);
  callbacksRef.current = options.callbacks;

  const { rid } = options;

  const fetchConfig = useCallback(async (): Promise<boolean> => {
    dispatch({ type: "start" });
    const [errorCode, data] = await client.auth.getInternalMatchingConfig({ rid });
    if (errorCode === null) {
      dispatch({ type: "set_config", config: data as InternalMatchingConfig });
      return true;
    }
    dispatch({ type: "error", error: errorCode });
    callbacksRef.current?.onError?.(errorCode);
    return false;
  }, [client, rid]);

  const autoFetchConfig = options.autoFetchConfig;
  useEffect(() => {
    if (autoFetchConfig !== false) {
      void fetchConfig();
    }
  }, [fetchConfig, autoFetchConfig]);

  const checkMatch = useCallback(
    async (matchingValue: string, additionalAttributes?: Record<string, string>): Promise<CheckMatchOutcome> => {
      dispatch({ type: "start" });
      const [errorCode, data] = await client.auth.checkInternalMatch(
        { matching_value: matchingValue, matching_additional_attributes: additionalAttributes ?? {} },
        { rid },
      );
      if (errorCode === null) {
        dispatch({ type: "set_match", matchResult: data as InternalMatchResult });
        return "found";
      }
      if (errorCode === "internal_matching_match_not_found") {
        dispatch({ type: "clear_match" });
        return "not_found";
      }
      dispatch({ type: "error", error: errorCode });
      callbacksRef.current?.onError?.(errorCode);
      return "error";
    },
    [client, rid],
  );

  const confirmMatch = useCallback(
    async (matchingUserId: string | number): Promise<ConfirmMatchOutcome> => {
      dispatch({ type: "start" });
      const [errorCode] = await client.auth.confirmInternalMatch({ matching_user_id: matchingUserId }, { rid });
      if (errorCode === null) {
        dispatch({ type: "success" });
        callbacksRef.current?.onSuccess?.("Match confirmed");
        return "ok";
      }
      dispatch({ type: "error", error: errorCode });
      callbacksRef.current?.onError?.(errorCode);
      if (errorCode === "matching_user_not_found") return "not_found";
      if (errorCode === "matching_user_mismatch") return "mismatch";
      return "error";
    },
    [client, rid],
  );

  const skipMatch = useCallback(async (): Promise<SkipMatchOutcome> => {
    dispatch({ type: "start" });
    const [errorCode] = await client.auth.skipInternalMatch({ rid });
    if (errorCode === null) {
      dispatch({ type: "clear_match" });
      callbacksRef.current?.onSuccess?.("Match skipped");
      return "ok";
    }
    dispatch({ type: "error", error: errorCode });
    callbacksRef.current?.onError?.(errorCode);
    if (errorCode === "registration_expired") return "expired";
    return "error";
  }, [client, rid]);

  return {
    config: state.config,
    matchResult: state.matchResult,
    isLoading: state.isLoading,
    error: state.error,
    fetchConfig,
    checkMatch,
    confirmMatch,
    skipMatch,
  };
}
