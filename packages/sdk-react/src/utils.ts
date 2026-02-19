import type { HookCallbacks } from "./types";

export function isSuccess<T>(result: [string, unknown] | [null, T]): result is [null, T] {
  return result[0] === null;
}

/** Returns the current page URL, stripping transient query params (email, newsletter_error). */
export function currentPageUrl(): string {
  const baseUrl = `${location.origin}${location.pathname}`;
  const params = new URLSearchParams(location.search);
  for (const key of ["email", "newsletter_error"]) {
    params.delete(key);
  }
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/** Extracts the success data type from an SDK result tuple. */
// biome-ignore lint/suspicious/noExplicitAny: needed to extract the [null, T] branch from SDK result unions
type SuccessData<T extends [string | null, unknown, ...unknown[]]> = Extract<T, [null, any, ...unknown[]]>[1];
type ErrorData<T extends [string | null, unknown, ...unknown[]]> = Exclude<T, [null, unknown, ...unknown[]]>[1];

/**
 * Wraps an SDK call with loading/error state management.
 *
 * Handles the common pattern of: dispatch loading -> call SDK -> dispatch error or call onSuccess.
 * The caller only needs to handle the success path; error dispatching + callbacks are automatic.
 */
export async function runMutation<TResult extends [string | null, unknown, ...unknown[]]>(
  sdkCall: () => Promise<TResult>,
  handlers: {
    onMutate: () => void;
    onSuccess: (data: SuccessData<TResult>) => boolean | undefined;
    onError: (error: string, data: ErrorData<TResult>) => void;
  },
): Promise<boolean> {
  handlers.onMutate();
  const result = await sdkCall();
  if (result[0] === null) {
    const succeeded = handlers.onSuccess(result[1] as SuccessData<TResult>);
    return succeeded !== false;
  }
  handlers.onError(result[0], result[1] as ErrorData<TResult>);
  return false;
}

/**
 * Creates pre-bound onMutate/onError handlers for use with `runMutation`.
 * Since these two are always the same within a hook, bind them once.
 */
export function createMutationHandlers(
  // biome-ignore lint/suspicious/noExplicitAny: action types vary per hook
  dispatch: (action: any) => void,
  callbacksRef: React.RefObject<HookCallbacks | undefined>,
  startType: string,
  errorType: string,
) {
  return {
    onMutate: () => dispatch({ type: startType }),
    onError: (error: string) => {
      dispatch({ type: errorType, error });
      callbacksRef.current?.onError?.(error);
    },
  };
}
