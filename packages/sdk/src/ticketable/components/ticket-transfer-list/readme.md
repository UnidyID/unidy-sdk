# u-ticket-transfer-list



<!-- Auto Generated Below -->


## Overview

Lists the user's pending ticket transfers for one direction.

Renders a user-supplied `<template>` per transfer with `<transfer-value>`
substitutions (e.g. `ticket.title`, `sender_email`, `expires_at`) and
`<transfer-conditional>` blocks. `u-ticket-transfer-action` elements inside
the template get the transfer `token` stamped automatically, and the list
refetches after a successful action.

## Properties

| Property                 | Attribute           | Description                                                                       | Type                       | Default     |
| ------------------------ | ------------------- | --------------------------------------------------------------------------------- | -------------------------- | ----------- |
| `containerClass`         | `container-class`   | CSS classes to apply to the container element.                                    | `string`                   | `undefined` |
| `direction` _(required)_ | `direction`         | Which side of the user's pending transfers to display ('incoming' or 'outgoing'). | `"incoming" \| "outgoing"` | `undefined` |
| `skeletonAllText`        | `skeleton-all-text` | If true, replaces all text content with skeleton loaders.                         | `boolean`                  | `false`     |
| `skeletonCount`          | `skeleton-count`    | Number of skeleton items to show while loading.                                   | `number`                   | `3`         |
| `target`                 | `target`            | CSS selector for the target element where items will be rendered.                 | `string`                   | `undefined` |


## Events

| Event                        | Description                                                                      | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uTicketTransferListError`   | Fired when fetching transfers fails. Contains the error message.                 | `CustomEvent<{ direction?: TicketTransferDirection; error: string; }>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `uTicketTransferListSuccess` | Fired when transfers are successfully fetched. Contains the direction and items. | `CustomEvent<{ direction: TicketTransferDirection; items: { token: string; status: "expired" \| "pending" \| "accepted" \| "canceled" \| "declined"; recipient_email: string; sender_email: string; expires_at: Date; created_at: Date; ticket: { id: string; title: string; reference: string; exportable_to_wallet: boolean; state: string; created_at: Date; updated_at: Date; user_id: string; starts_at: Date; ticket_category_id: string; metadata?: JSONType; wallet_export?: JSONType; payment_state?: string; currency?: string; button_cta_url?: string; text?: string; info_banner?: string; seating?: string; venue?: string; ends_at?: Date; price?: number; }; }[]; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
