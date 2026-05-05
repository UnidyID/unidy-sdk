import type { PaginationMeta, Transaction, TransactionsListResponse } from "@unidy.io/sdk/standalone";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useUnidyClient } from "../../provider";
import type { HookCallbacks } from "../../types";
import type { UsePaginationReturn } from "../ticketable/use-pagination";

export interface TransactionFilter {
  state?: string;
  financialStatus?: string;
  orderType?: string;
  sourcePlatform?: string;
  externalId?: string;
  orderBy?: "placed_at" | "created_at" | "total";
  orderDirection?: "asc" | "desc";
}

type PaginationInput = UsePaginationReturn | { page?: number; perPage?: number };

export interface UseTransactionsOptions {
  pagination?: PaginationInput;
  filter?: TransactionFilter;
  /** Fetch on mount. Default: true */
  fetchOnMount?: boolean;
  callbacks?: HookCallbacks;
}

export interface UseTransactionsReturn {
  items: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getTransaction: (id: string) => Promise<Transaction | null>;
}

interface State {
  items: Transaction[];
  isLoading: boolean;
  error: string | null;
}

type Action = { type: "fetch_start" } | { type: "fetch_success"; items: Transaction[] } | { type: "fetch_error"; error: string };

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

function hasSetMeta(pagination: PaginationInput | undefined): pagination is UsePaginationReturn {
  return pagination != null && "setMeta" in pagination && typeof pagination.setMeta === "function";
}

export function useTransactions(options?: UseTransactionsOptions): UseTransactionsReturn {
  const client = useUnidyClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const page = options?.pagination?.page ?? 1;
  const perPage = options?.pagination?.perPage ?? 10;
  const filterState = options?.filter?.state;
  const filterFinancialStatus = options?.filter?.financialStatus;
  const filterOrderType = options?.filter?.orderType;
  const filterSourcePlatform = options?.filter?.sourcePlatform;
  const filterExternalId = options?.filter?.externalId;
  const filterOrderBy = options?.filter?.orderBy;
  const filterOrderDirection = options?.filter?.orderDirection;

  const fetchItems = useCallback(async () => {
    dispatch({ type: "fetch_start" });
    const p = optionsRef.current?.pagination;
    const callbacks = optionsRef.current?.callbacks;

    const result = await client.transactions.list({
      page,
      perPage,
      state: filterState,
      financialStatus: filterFinancialStatus,
      orderType: filterOrderType,
      sourcePlatform: filterSourcePlatform,
      externalId: filterExternalId,
      orderBy: filterOrderBy,
      orderDirection: filterOrderDirection,
    });

    const [errorCode, data] = result;
    if (errorCode === null) {
      const response = data as TransactionsListResponse;
      dispatch({ type: "fetch_success", items: response.results });
      if (hasSetMeta(p)) {
        p.setMeta(response.meta as PaginationMeta);
      }
      callbacks?.onSuccess?.("Fetched successfully");
    } else {
      dispatch({ type: "fetch_error", error: errorCode });
      callbacks?.onError?.(errorCode);
    }
  }, [
    client,
    page,
    perPage,
    filterState,
    filterFinancialStatus,
    filterOrderType,
    filterSourcePlatform,
    filterExternalId,
    filterOrderBy,
    filterOrderDirection,
  ]);

  const fetchOnMount = options?.fetchOnMount;
  useEffect(() => {
    if (fetchOnMount !== false) {
      void fetchItems();
    }
  }, [fetchItems, fetchOnMount]);

  const getTransaction = useCallback(
    async (id: string): Promise<Transaction | null> => {
      const result = await client.transactions.get({ id });
      const [errorCode, data] = result;
      if (errorCode === null) {
        return data as Transaction;
      }
      optionsRef.current?.callbacks?.onError?.(errorCode);
      return null;
    },
    [client],
  );

  return {
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchItems,
    getTransaction,
  };
}
