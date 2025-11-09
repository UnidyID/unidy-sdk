import { createStore } from '@stencil/store';
import type { PaginationMeta } from '@unidy.io/sdk-api-client';

export interface PaginationState {
  paginationMeta: PaginationMeta | null;
}

export function createPaginationStore() {
  const initialState: PaginationState = {
    paginationMeta: null,
  };

  const { state, onChange } = createStore<PaginationState>(initialState);

  return { state, onChange };
}

export type PaginationStore = ReturnType<typeof createPaginationStore>;

