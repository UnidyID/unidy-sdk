import type { TicketTransfer, TicketTransferActionResult, TicketTransfersListResult } from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { runMutation } from "../../utils";

// --- Types ---

export interface UseTicketTransfersOptions {
  /** Fetch on mount. Default: true */
  fetchOnMount?: boolean;
  callbacks?: HookCallbacks;
}

export interface UseTicketTransfersReturn {
  /** Pending transfers addressed to the authenticated user. */
  incoming: TicketTransfer[];
  /** Pending transfers sent by the authenticated user. */
  outgoing: TicketTransfer[];
  isLoading: boolean;
  /** True while a create/accept/decline/cancel call is in flight. */
  isMutating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Sends a transfer offer for an owned ticket. Returns the created transfer, or null on error. */
  createTransfer: (ticketId: string, recipientEmail: string) => Promise<TicketTransfer | null>;
  /** Accepts an incoming transfer offer. Returns the updated transfer, or null on error. */
  acceptTransfer: (token: string) => Promise<TicketTransfer | null>;
  /** Declines an incoming transfer offer. Returns the updated transfer, or null on error. */
  declineTransfer: (token: string) => Promise<TicketTransfer | null>;
  /** Cancels an outgoing transfer offer. Returns the updated transfer, or null on error. */
  cancelTransfer: (token: string) => Promise<TicketTransfer | null>;
}

// --- Reducer ---

interface State {
  incoming: TicketTransfer[];
  outgoing: TicketTransfer[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
}

type Action =
  | { type: "fetch_start" }
  | { type: "fetch_success"; incoming: TicketTransfer[]; outgoing: TicketTransfer[] }
  | { type: "fetch_error"; error: string }
  | { type: "mutate_start" }
  | { type: "mutate_success" }
  | { type: "mutate_error"; error: string };

const initialState: State = { incoming: [], outgoing: [], isLoading: false, isMutating: false, error: null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch_start":
      return { ...state, isLoading: true, error: null };
    case "fetch_success":
      return { ...state, incoming: action.incoming, outgoing: action.outgoing, isLoading: false, error: null };
    case "fetch_error":
      return { ...state, isLoading: false, error: action.error };
    case "mutate_start":
      return { ...state, isMutating: true, error: null };
    case "mutate_success":
      return { ...state, isMutating: false };
    case "mutate_error":
      return { ...state, isMutating: false, error: action.error };
  }
}

// --- Hook ---

export function useTicketTransfers(options: UseTicketTransfersOptions = {}): UseTicketTransfersReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchOnMount = options.fetchOnMount;

  const fetchIdRef = useRef(0);

  const fetchTransfers = useCallback(async () => {
    // Overlapping fetches (mount fetch vs post-mutation refetch) must not let
    // an older response overwrite a newer one — only the latest fetch dispatches.
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "fetch_start" });
    const callbacks = optionsRef.current.callbacks;

    // The try only wraps the SDK call — a throwing consumer callback must not
    // be converted into a spurious fetch_error after a successful fetch.
    let result: TicketTransfersListResult;
    try {
      result = await client.ticketTransfers.list();
    } catch {
      result = ["internal_error", null];
    }
    if (fetchId !== fetchIdRef.current) return;

    const [errorCode, data] = result;
    if (errorCode === null && data) {
      dispatch({ type: "fetch_success", incoming: data.incoming, outgoing: data.outgoing });
      callbacks?.onSuccess?.("Fetched successfully");
    } else {
      const error = errorCode ?? "invalid_response";
      dispatch({ type: "fetch_error", error });
      callbacks?.onError?.(error);
    }
  }, [client]);

  useEffect(() => {
    if (fetchOnMount !== false) {
      void fetchTransfers();
    }
  }, [fetchTransfers, fetchOnMount]);

  const runTransferMutation = useCallback(
    async (sdkCall: () => Promise<TicketTransferActionResult>): Promise<TicketTransfer | null> => {
      let transfer: TicketTransfer | null = null;

      // A thrown SDK call (instead of an error tuple, e.g. a rejecting token
      // provider) becomes a normal error tuple so isMutating is always resolved
      // and the error callback fires exactly once.
      const safeCall = async (): Promise<TicketTransferActionResult> => {
        try {
          return await sdkCall();
        } catch {
          return ["internal_error", null];
        }
      };

      const ok = await runMutation(safeCall, {
        onMutate: () => dispatch({ type: "mutate_start" }),
        onSuccess: (data) => {
          transfer = data;
          dispatch({ type: "mutate_success" });
        },
        onError: (errorCode) => {
          dispatch({ type: "mutate_error", error: errorCode });
          optionsRef.current.callbacks?.onError?.(errorCode);
        },
      });

      if (!ok) return null;
      await fetchTransfers();
      return transfer;
    },
    [fetchTransfers],
  );

  const createTransfer = useCallback(
    (ticketId: string, recipientEmail: string) => runTransferMutation(() => client.ticketTransfers.create({ ticketId, recipientEmail })),
    [client, runTransferMutation],
  );

  const acceptTransfer = useCallback(
    (token: string) => runTransferMutation(() => client.ticketTransfers.accept({ token })),
    [client, runTransferMutation],
  );

  const declineTransfer = useCallback(
    (token: string) => runTransferMutation(() => client.ticketTransfers.decline({ token })),
    [client, runTransferMutation],
  );

  const cancelTransfer = useCallback(
    (token: string) => runTransferMutation(() => client.ticketTransfers.cancel({ token })),
    [client, runTransferMutation],
  );

  return {
    incoming: state.incoming,
    outgoing: state.outgoing,
    isLoading: state.isLoading,
    isMutating: state.isMutating,
    error: state.error,
    refetch: fetchTransfers,
    createTransfer,
    acceptTransfer,
    declineTransfer,
    cancelTransfer,
  };
}
