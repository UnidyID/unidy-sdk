# my-component



<!-- Auto Generated Below -->


## Properties

| Property                      | Attribute           | Description | Type                                                                                                                                                             | Default                       |
| ----------------------------- | ------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `apiKey`                      | `api-key`           |             | `string`                                                                                                                                                         | `'public-newsletter-api-key'` |
| `baseUrl`                     | `base-url`          |             | `string`                                                                                                                                                         | `'http://localhost:3000'`     |
| `containerClass`              | `container-class`   |             | `string`                                                                                                                                                         | `undefined`                   |
| `filter`                      | `filter`            |             | `string`                                                                                                                                                         | `''`                          |
| `limit`                       | `limit`             |             | `number`                                                                                                                                                         | `10`                          |
| `locale`                      | `locale`            |             | `string`                                                                                                                                                         | `'en-US'`                     |
| `page`                        | `page`              |             | `number`                                                                                                                                                         | `1`                           |
| `paginationMeta`              | --                  |             | `{ count: number; page: number; limit: number; last: number; prev?: number; next?: number; }`                                                                    | `null`                        |
| `skeletonAllText`             | `skeleton-all-text` |             | `boolean`                                                                                                                                                        | `false`                       |
| `skeletonCount`               | `skeleton-count`    |             | `number`                                                                                                                                                         | `undefined`                   |
| `store`                       | --                  |             | `{ state: PaginationState; onChange: <K extends keyof PaginationState>(prop: K, cb: (newValue: PaginationState[K]) => void) => () => void; reset: () => void; }` | `null`                        |
| `target`                      | `target`            |             | `string`                                                                                                                                                         | `undefined`                   |
| `ticketableType` _(required)_ | `ticketable-type`   |             | `"subscription" \| "ticket"`                                                                                                                                     | `undefined`                   |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
