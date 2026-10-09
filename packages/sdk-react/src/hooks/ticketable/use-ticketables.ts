import type { ExportLink, Page, Subscription, SubscriptionsListResponse, Ticket, TicketsListResponse } from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import { runMutation } from "../../utils";
import type { UsePaginationReturn } from "./use-pagination";

export type ExportFormat = "pdf" | "pkpass";
export type { ExportLink };

// --- Types ---

export type TicketableType = "ticket" | "subscription";

export interface TicketableFilter {
  state?: string;
  paymentState?: string;
  orderBy?: "starts_at" | "ends_at" | "reference" | "created_at";
  orderDirection?: "asc" | "desc";
  ticketCategoryId?: string;
  subscriptionCategoryId?: string;
}

type PaginationInput = UsePaginationReturn | { page?: number; perPage?: number };

export interface UseTicketablesOptions {
  type: TicketableType;
  pagination?: PaginationInput;
  filter?: TicketableFilter;
  /** Fetch on mount. Default: true */
  fetchOnMount?: boolean;
  callbacks?: HookCallbacks;
}

export interface UseTicketablesReturn<T = Ticket | Subscription> {
  items: T[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getExportLink: (id: string, format: ExportFormat) => Promise<ExportLink | null>;
}

// --- Reducer ---

interface State {
  items: (Ticket | Subscription)[];
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: "fetch_start" }
  | { type: "fetch_success"; items: (Ticket | Subscription)[] }
  | { type: "fetch_error"; error: string };

const initialState: State = { items: [], isLoading: false, error: null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch_start":
      return { ...state, isLoading: true, error: null };
    case "fetch_success":
      return { items: action.items, isLoading: false, error: null };
    case "fetch_error":
      return { ...state, isLoading: false, error: action.error };
  }
}

// --- Helpers ---

function hasSetMeta(pagination: PaginationInput | undefined): pagination is UsePaginationReturn {
  return pagination != null && "setMeta" in pagination && typeof pagination.setMeta === "function";
}

function handleListResponse<T extends Page<Ticket | Subscription>>(
  result: [string, ...unknown[]] | [null, T],
  pagination: PaginationInput | undefined,
  dispatch: React.Dispatch<Action>,
  callbacks: HookCallbacks | undefined,
): void {
  const [errorCode, data] = result;
  if (errorCode === null) {
    const response = data as T;
    dispatch({ type: "fetch_success", items: response.records });
    if (hasSetMeta(pagination)) {
      pagination.setMeta(response.pagination);
    }
    callbacks?.onSuccess?.("Fetched successfully");
  } else {
    dispatch({ type: "fetch_error", error: errorCode });
    callbacks?.onError?.(errorCode);
  }
}

// --- Hook ---

export function useTicketables(options: UseTicketablesOptions & { type: "ticket" }): UseTicketablesReturn<Ticket>;
export function useTicketables(options: UseTicketablesOptions & { type: "subscription" }): UseTicketablesReturn<Subscription>;
export function useTicketables(options: UseTicketablesOptions): UseTicketablesReturn;
export function useTicketables(options: UseTicketablesOptions): UseTicketablesReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { type, pagination, filter } = options;
  const fetchOnMount = options.fetchOnMount;
  const page = pagination?.page ?? 1;
  const perPage = pagination?.perPage ?? 10;
  const filterState = filter?.state;
  const filterPaymentState = filter?.paymentState;
  const filterOrderBy = filter?.orderBy;
  const filterOrderDirection = filter?.orderDirection;
  const filterTicketCategoryId = filter?.ticketCategoryId;
  const filterSubscriptionCategoryId = filter?.subscriptionCategoryId;

  const fetchItems = useCallback(async () => {
    dispatch({ type: "fetch_start" });
    const p = optionsRef.current.pagination;
    const callbacks = optionsRef.current.callbacks;

    const baseArgs = {
      page,
      perPage,
      state: filterState,
      paymentState: filterPaymentState,
      orderBy: filterOrderBy,
      orderDirection: filterOrderDirection,
    };

    if (type === "ticket") {
      const result = await client.tickets.list({
        ...baseArgs,
        ticketCategoryId: filterTicketCategoryId,
      });
      handleListResponse<TicketsListResponse>(result, p, dispatch, callbacks);
    } else {
      const result = await client.subscriptions.list({
        ...baseArgs,
        subscriptionCategoryId: filterSubscriptionCategoryId,
      });
      handleListResponse<SubscriptionsListResponse>(result, p, dispatch, callbacks);
    }
  }, [
    client,
    type,
    page,
    perPage,
    filterState,
    filterPaymentState,
    filterOrderBy,
    filterOrderDirection,
    filterTicketCategoryId,
    filterSubscriptionCategoryId,
  ]);

  useEffect(() => {
    if (fetchOnMount !== false) {
      void fetchItems();
    }
  }, [fetchItems, fetchOnMount]);

  const getExportLink = useCallback(
    async (id: string, format: ExportFormat): Promise<ExportLink | null> => {
      const service = optionsRef.current.type === "ticket" ? client.tickets : client.subscriptions;
      let exportLink: ExportLink | null = null;
      const ok = await runMutation(() => service.getExportLink({ id, format }), {
        onMutate: () => {},
        onSuccess: (data) => {
          exportLink = data as ExportLink;
        },
        onError: (errorCode) => {
          optionsRef.current.callbacks?.onError?.(errorCode);
        },
      });
      return ok ? exportLink : null;
    },
    [client],
  );

  return {
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchItems,
    getExportLink,
  };
}
