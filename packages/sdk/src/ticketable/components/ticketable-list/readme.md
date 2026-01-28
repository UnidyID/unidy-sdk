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


## Events

| Event                    | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uTicketableListError`   |             | `CustomEvent<{ ticketableType?: "subscription" \| "ticket"; error: string; }>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `uTicketableListSuccess` |             | `CustomEvent<{ ticketableType: "subscription" \| "ticket"; items: { id: string; title: string; text: string; exportable_to_wallet: boolean; state: string; reference: string; created_at: Date; updated_at: Date; price: number; user_id: string; subscription_category_id: string; payment_frequency?: string; metadata?: Record<string, unknown>; wallet_export?: Record<string, unknown>; payment_state?: string; currency?: string; button_cta_url?: string; starts_at?: Date; ends_at?: Date; next_payment_at?: Date; }[] \| { id: string; title: string; reference: string; exportable_to_wallet: boolean; state: string; starts_at: Date; created_at: Date; updated_at: Date; price: number; user_id: string; ticket_category_id: string; text?: string; metadata?: Record<string, unknown>; wallet_export?: Record<string, unknown>; payment_state?: string; button_cta_url?: string; info_banner?: string; seating?: string; venue?: string; currency?: string; ends_at?: Date; }[]; paginationMeta: { count: number; page: number; limit: number; last: number; prev?: number; next?: number; }; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
