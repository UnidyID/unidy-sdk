# my-component



<!-- Auto Generated Below -->


## Properties

| Property                      | Attribute           | Description | Type                                                                                                                                                             | Default     |
| ----------------------------- | ------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `containerClass`              | `container-class`   |             | `string`                                                                                                                                                         | `undefined` |
| `filter`                      | `filter`            |             | `string`                                                                                                                                                         | `""`        |
| `limit`                       | `limit`             |             | `number`                                                                                                                                                         | `10`        |
| `page`                        | `page`              |             | `number`                                                                                                                                                         | `1`         |
| `paginationMeta`              | --                  |             | `{ count: number; page: number; limit: number; last: number; prev?: number; next?: number; }`                                                                    | `null`      |
| `skeletonAllText`             | `skeleton-all-text` |             | `boolean`                                                                                                                                                        | `false`     |
| `skeletonCount`               | `skeleton-count`    |             | `number`                                                                                                                                                         | `undefined` |
| `store`                       | --                  |             | `{ state: PaginationState; onChange: <K extends keyof PaginationState>(prop: K, cb: (newValue: PaginationState[K]) => void) => () => void; reset: () => void; }` | `null`      |
| `target`                      | `target`            |             | `string`                                                                                                                                                         | `undefined` |
| `ticketableType` _(required)_ | `ticketable-type`   |             | `"subscription" \| "ticket"`                                                                                                                                     | `undefined` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
