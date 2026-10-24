import type {
  Ticket,
  TicketTransfer,
  TicketTransferActionResult,
  TicketTransferCreateArgs,
  TicketTransfersListAllResult,
  TicketTransferTicketActionResult,
} from "@unidy.io/sdk/standalone";
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
  /** Open offers the authenticated user can accept. */
  incoming: TicketTransfer[];
  /** Open offers the authenticated user sent. */
  outgoing: TicketTransfer[];
  isLoading: boolean;
  /** True while a create/accept/decline/cancel/claim/revoke/return call is in flight. */
  isMutating: boolean;
  /** A transfer reason (e.g. `transfer_expired`) or a V2 error identifier. */
  error: string | null;
  refetch: () => Promise<void>;
  /** Offers an owned ticket by email, or as a claim link (`mode: "link"`). Returns the created transfer, or null on error. */
  createTransfer: (args: TicketTransferCreateArgs) => Promise<TicketTransfer | null>;
  /** Accepts an incoming offer by its id. Returns the updated transfer, or null on error. */
  acceptTransfer: (id: string) => Promise<TicketTransfer | null>;
  /** Declines an incoming offer by its id. Returns the updated transfer, or null on error. */
  declineTransfer: (id: string) => Promise<TicketTransfer | null>;
  /** Cancels an outgoing offer by its id. Returns the updated transfer, or null on error. */
  cancelTransfer: (id: string) => Promise<TicketTransfer | null>;
  /** Accepts the offer behind a claim link by its token. Returns the updated transfer, or null on error. */
  claimTransfer: (token: string) => Promise<TicketTransfer | null>;
  /** Owner takes a lent ticket back from its holder. Returns the updated ticket, or null on error. */
  revokeTransfer: (ticketId: string) => Promise<Ticket | null>;
  /** Holder returns a lent ticket to its owner. Returns the updated ticket, or null on error. */
  returnTransfer: (ticketId: string) => Promise<Ticket | null>;
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
  | { type: "fetch_success"; transfers: TicketTransfer[] }
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
      return {
        ...state,
        incoming: action.transfers.filter((transfer) => transfer.direction === "incoming"),
        outgoing: action.transfers.filter((transfer) => transfer.direction === "outgoing"),
        isLoading: false,
        error: null,
      };
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
    let result: TicketTransfersListAllResult;
    try {
      result = await client.ticketTransfers.listAll();
    } catch {
      result = ["internal_error", null];
    }
    if (fetchId !== fetchIdRef.current) return;

    const [errorCode, transfers] = result;
    if (errorCode === null) {
      dispatch({ type: "fetch_success", transfers });
      callbacks?.onSuccess?.("Fetched successfully");
    } else {
      dispatch({ type: "fetch_error", error: errorCode });
      callbacks?.onError?.(errorCode);
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

  const runTicketMutation = useCallback(
    async (sdkCall: () => Promise<TicketTransferTicketActionResult>): Promise<Ticket | null> => {
      let ticket: Ticket | null = null;

      const safeCall = async (): Promise<TicketTransferTicketActionResult> => {
        try {
          return await sdkCall();
        } catch {
          return ["internal_error", null];
        }
      };

      const ok = await runMutation(safeCall, {
        onMutate: () => dispatch({ type: "mutate_start" }),
        onSuccess: (data) => {
          ticket = data;
          dispatch({ type: "mutate_success" });
        },
        onError: (errorCode) => {
          dispatch({ type: "mutate_error", error: errorCode });
          optionsRef.current.callbacks?.onError?.(errorCode);
        },
      });

      if (!ok) return null;
      await fetchTransfers();
      return ticket;
    },
    [fetchTransfers],
  );

  const createTransfer = useCallback(
    (args: TicketTransferCreateArgs) => runTransferMutation(() => client.ticketTransfers.create(args)),
    [client, runTransferMutation],
  );

  const acceptTransfer = useCallback(
    (id: string) => runTransferMutation(() => client.ticketTransfers.accept({ id })),
    [client, runTransferMutation],
  );

  const declineTransfer = useCallback(
    (id: string) => runTransferMutation(() => client.ticketTransfers.decline({ id })),
    [client, runTransferMutation],
  );

  const cancelTransfer = useCallback(
    (id: string) => runTransferMutation(() => client.ticketTransfers.cancel({ id })),
    [client, runTransferMutation],
  );

  const claimTransfer = useCallback(
    (token: string) => runTransferMutation(() => client.ticketTransfers.claim({ token })),
    [client, runTransferMutation],
  );

  const revokeTransfer = useCallback(
    (ticketId: string) => runTicketMutation(() => client.ticketTransfers.revoke({ ticketId })),
    [client, runTicketMutation],
  );

  const returnTransfer = useCallback(
    (ticketId: string) => runTicketMutation(() => client.ticketTransfers.return({ ticketId })),
    [client, runTicketMutation],
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
    claimTransfer,
    revokeTransfer,
    returnTransfer,
  };
}
