import { createStore } from "@stencil/store";
import type { Pagination } from "../../api";

export interface PaginationState {
  paginationMeta: Pagination | null;
}

export type PaginationStore = {
  state: PaginationState;
  onChange: <K extends keyof PaginationState>(prop: K, cb: (newValue: PaginationState[K]) => void) => () => void;
  reset: () => void;
};

export function createPaginationStore(): PaginationStore {
  const initialState: PaginationState = {
    paginationMeta: null,
  };

  const store = createStore<PaginationState>(initialState);

  return { state: store.state, onChange: store.onChange, reset: store.reset };
}
