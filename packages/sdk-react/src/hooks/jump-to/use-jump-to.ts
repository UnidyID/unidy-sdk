import type { JumpToServiceRequest, JumpToUnidyRequest } from "@unidy.io/sdk/standalone";
import { useCallback, useRef, useState } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";

export interface UseJumpToOptions {
  callbacks?: HookCallbacks;
}

export interface UseJumpToReturn {
  isLoading: boolean;
  error: string | null;
  jumpToService: (serviceId: string, request: JumpToServiceRequest) => Promise<string | null>;
  jumpToUnidy: (request: JumpToUnidyRequest) => Promise<string | null>;
}

export function useJumpTo(options?: UseJumpToOptions): UseJumpToReturn {
  const client = useUnidyClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbacksRef = useRef(options?.callbacks);
  callbacksRef.current = options?.callbacks;

  const jumpToService = useCallback(
    async (serviceId: string, request: JumpToServiceRequest): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      const [errorCode, data] = await client.auth.jumpToService(serviceId, request);
      setIsLoading(false);
      if (errorCode === null) {
        callbacksRef.current?.onSuccess?.("Jump token created");
        return data as string;
      }
      setError(errorCode);
      callbacksRef.current?.onError?.(errorCode);
      return null;
    },
    [client],
  );

  const jumpToUnidy = useCallback(
    async (request: JumpToUnidyRequest): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      const [errorCode, data] = await client.auth.jumpToUnidy(request);
      setIsLoading(false);
      if (errorCode === null) {
        callbacksRef.current?.onSuccess?.("Jump token created");
        return data as string;
      }
      setError(errorCode);
      callbacksRef.current?.onError?.(errorCode);
      return null;
    },
    [client],
  );

  return {
    isLoading,
    error,
    jumpToService,
    jumpToUnidy,
  };
}
