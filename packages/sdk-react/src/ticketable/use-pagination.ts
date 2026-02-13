import type { PaginationMeta } from "@unidy.io/sdk/standalone";
import { useCallback, useMemo, useState } from "react";

export interface UsePaginationOptions {
  perPage?: number;
  initialPage?: number;
}

export interface UsePaginationReturn {
  /** Current page number (1-based) */
  page: number;
  /** Items per page */
  perPage: number;
  /** Total number of pages (0 until meta arrives) */
  totalPages: number;
  /** Total number of items (0 until meta arrives) */
  totalItems: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
  /** Go to the next page (no-op if on last page) */
  nextPage: () => void;
  /** Go to the previous page (no-op if on first page) */
  prevPage: () => void;
  /** Go to a specific page (clamped to valid range) */
  goToPage: (page: number) => void;
  /** Called by useTicketables after fetch to update pagination meta */
  setMeta: (meta: PaginationMeta) => void;
}

export function usePagination(options?: UsePaginationOptions): UsePaginationReturn {
  const perPage = options?.perPage ?? 10;
  const [page, setPage] = useState(options?.initialPage ?? 1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const totalPages = meta?.last ?? 0;
  const totalItems = meta?.count ?? 0;
  const hasNextPage = meta?.next !== null && meta?.next !== undefined;
  const hasPrevPage = meta?.prev !== null && meta?.prev !== undefined;

  const nextPage = useCallback(() => {
    setPage((p) => {
      if (meta?.next != null) return meta.next;
      return p;
    });
  }, [meta]);

  const prevPage = useCallback(() => {
    setPage((p) => {
      if (meta?.prev != null) return meta.prev;
      return p;
    });
  }, [meta]);

  const goToPage = useCallback(
    (target: number) => {
      setPage(Math.max(1, Math.min(target, totalPages || target)));
    },
    [totalPages],
  );

  return useMemo(
    () => ({
      page,
      perPage,
      totalPages,
      totalItems,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      goToPage,
      setMeta,
    }),
    [page, perPage, totalPages, totalItems, hasNextPage, hasPrevPage, nextPage, prevPage, goToPage],
  );
}
