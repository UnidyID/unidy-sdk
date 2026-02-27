# u-ticketable-list

Fetches and renders a list of tickets or subscriptions. Requires a `<template>` element as a child to define the layout for each item.

## Template Elements

Inside the template, you can use the following special elements:

### `<ticketable-value>`

Displays a value from the ticket or subscription object.

```html
<ticketable-value name="title"></ticketable-value>
<ticketable-value name="starts_at" date-format="dd.MM.yyyy"></ticketable-value>
<ticketable-value name="price" format="Price: {{value}}"></ticketable-value>
<ticketable-value name="metadata.category" default="N/A"></ticketable-value>
```

**Attributes:**
- `name` - Property path (supports nested: `metadata.foo.bar`, `items.[0].name`)
- `date-format` - Format string for dates (locales: en, de, fr, nl_be, ro, sv)
- `format` - Value formatting template (e.g., `Price: {{value}}`)
- `default` - Fallback if property is missing

### `<ticketable-conditional>`

Conditionally renders children based on a property's truthiness.

```html
<ticketable-conditional when="metadata.vip">
  <span class="badge">VIP</span>
</ticketable-conditional>

<ticketable-conditional when="wallet_export">
  <u-ticketable-export format="pkpass">Wallet</u-ticketable-export>
</ticketable-conditional>
```

**Attributes:**
- `when` - Property path to check (supports nested paths)

### `unidy-attr`

Dynamically sets HTML attributes from ticket/subscription data.

```html
<a unidy-attr unidy-attr-href="{{button_cta_url}}">View</a>
<img unidy-attr unidy-attr-src="{{metadata.image_url}}" />
```

<!-- Auto Generated Below -->


## Properties

| Property                      | Attribute           | Description                                                              | Type                                                                                                                                                             | Default     |
| ----------------------------- | ------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `containerClass`              | `container-class`   | CSS classes to apply to the container element.                           | `string`                                                                                                                                                         | `undefined` |
| `filter`                      | `filter`            | Filter string for API queries (e.g., 'state=active;payment_state=paid'). | `string`                                                                                                                                                         | `""`        |
| `limit`                       | `limit`             | Number of items per page.                                                | `number`                                                                                                                                                         | `10`        |
| `page`                        | `page`              | Current page number.                                                     | `number`                                                                                                                                                         | `1`         |
| `paginationMeta`              | --                  | Pagination metadata from the API response.                               | `{ count: number; page: number; limit: number; last: number; prev?: number; next?: number; }`                                                                    | `null`      |
| `skeletonAllText`             | `skeleton-all-text` | If true, replaces all text content with skeleton loaders.                | `boolean`                                                                                                                                                        | `false`     |
| `skeletonCount`               | `skeleton-count`    | Number of skeleton items to show while loading. Defaults to limit.       | `number`                                                                                                                                                         | `undefined` |
| `store`                       | --                  | Pagination store instance for external state management.                 | `{ state: PaginationState; onChange: <K extends keyof PaginationState>(prop: K, cb: (newValue: PaginationState[K]) => void) => () => void; reset: () => void; }` | `null`      |
| `target`                      | `target`            | CSS selector for the target element where items will be rendered.        | `string`                                                                                                                                                         | `undefined` |
| `ticketableType` _(required)_ | `ticketable-type`   | The type of ticketable items to list ('ticket' or 'subscription').       | `"subscription" \| "ticket"`                                                                                                                                     | `undefined` |


## Events

| Event                    | Description                                                                        | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uTicketableListError`   | Fired when fetching items fails. Contains the error message.                       | `CustomEvent<{ ticketableType?: "subscription" \| "ticket"; error: string; }>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `uTicketableListSuccess` | Fired when items are successfully fetched. Contains items and pagination metadata. | `CustomEvent<{ ticketableType: "subscription" \| "ticket"; items: { id: string; title: string; text: string; exportable_to_wallet: boolean; state: string; reference: string; created_at: Date; updated_at: Date; price: number; user_id: string; subscription_category_id: string; payment_frequency?: string; metadata?: Record<string, unknown>; wallet_export?: Record<string, unknown>; payment_state?: string; currency?: string; button_cta_url?: string; starts_at?: Date; ends_at?: Date; next_payment_at?: Date; }[] \| { id: string; title: string; reference: string; exportable_to_wallet: boolean; state: string; starts_at: Date; created_at: Date; updated_at: Date; user_id: string; ticket_category_id: string; text?: string; metadata?: Record<string, unknown>; wallet_export?: Record<string, unknown>; payment_state?: string; button_cta_url?: string; info_banner?: string; seating?: string; venue?: string; currency?: string; ends_at?: Date; price?: number; }[]; paginationMeta: { count: number; page: number; limit: number; last: number; prev?: number; next?: number; }; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
