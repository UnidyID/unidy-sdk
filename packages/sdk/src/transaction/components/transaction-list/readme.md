# u-transaction-list



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute           | Description                                                                    | Type                                                                                                                                                             | Default     |
| ----------------- | ------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `containerClass`  | `container-class`   | CSS classes to apply to the container element.                                 | `string`                                                                                                                                                         | `undefined` |
| `filter`          | `filter`            | Filter string for API queries (e.g., 'state=completed;financial_status=paid'). | `string`                                                                                                                                                         | `""`        |
| `limit`           | `limit`             | Number of items per page.                                                      | `number`                                                                                                                                                         | `10`        |
| `page`            | `page`              | Current page number.                                                           | `number`                                                                                                                                                         | `1`         |
| `paginationMeta`  | --                  | Pagination metadata from the API response.                                     | `{ count: number; page: number; limit: number; last: number; prev?: number; next?: number; }`                                                                    | `null`      |
| `skeletonAllText` | `skeleton-all-text` | If true, replaces all text content with skeleton loaders.                      | `boolean`                                                                                                                                                        | `false`     |
| `skeletonCount`   | `skeleton-count`    | Number of skeleton items to show while loading. Defaults to limit.             | `number`                                                                                                                                                         | `undefined` |
| `store`           | --                  | Pagination store instance for external state management.                       | `{ state: PaginationState; onChange: <K extends keyof PaginationState>(prop: K, cb: (newValue: PaginationState[K]) => void) => () => void; reset: () => void; }` | `null`      |
| `target`          | `target`            | CSS selector for the target element where items will be rendered.              | `string`                                                                                                                                                         | `undefined` |


## Events

| Event                     | Description                                                                               | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uTransactionListError`   | Fired when fetching transactions fails. Contains the error message.                       | `CustomEvent<{ error: string; }>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `uTransactionListSuccess` | Fired when transactions are successfully fetched. Contains items and pagination metadata. | `CustomEvent<{ items: { id: string; user_id: string; created_at: Date; updated_at: Date; line_items: { id: string; description?: string; quantity?: number; unit_price?: number; total?: number; currency?: string; metadata?: unknown; }[]; external_id?: string; reference?: string; source_platform?: string; order_type?: string; state?: string; financial_status?: string; currency?: string; total?: number; placed_at?: Date; metadata?: unknown; }[]; paginationMeta: { count: number; page: number; limit: number; last: number; prev?: number; next?: number; }; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
