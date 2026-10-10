# u-ticket-transfer-list



<!-- Auto Generated Below -->


## Overview

Lists the user's open ticket transfer offers for one direction.

Renders a user-supplied `<template>` per transfer with `<transfer-value>`
substitutions (e.g. `ticket.title`, `sender_email`, `recipient_email`,
`expires_at`, `claim_url`) and `<transfer-conditional>` blocks.
`u-ticket-transfer-action` elements inside the template get the transfer
`transfer-id` stamped automatically, and the list refetches after a
successful action.

## Properties

| Property                 | Attribute           | Description                                                                                                            | Type                       | Default     |
| ------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------- |
| `containerClass`         | `container-class`   | CSS classes to apply to the container element.                                                                         | `string`                   | `undefined` |
| `direction` _(required)_ | `direction`         | Which side of the user's open offers to display: 'incoming' (offers they can accept) or 'outgoing' (offers they sent). | `"incoming" \| "outgoing"` | `undefined` |
| `skeletonAllText`        | `skeleton-all-text` | If true, replaces all text content with skeleton loaders.                                                              | `boolean`                  | `false`     |
| `skeletonCount`          | `skeleton-count`    | Number of skeleton items to show while loading.                                                                        | `number`                   | `3`         |
| `target`                 | `target`            | CSS selector for the target element where items will be rendered.                                                      | `string`                   | `undefined` |


## Events

| Event                        | Description                                                                      | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uTicketTransferListError`   | Fired when fetching transfers fails. Contains the error message.                 | `CustomEvent<{ direction?: "incoming" \| "outgoing"; error: string; }>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `uTicketTransferListSuccess` | Fired when transfers are successfully fetched. Contains the direction and items. | `CustomEvent<{ direction: "incoming" \| "outgoing"; items: { id: string; status: "expired" \| "pending" \| "accepted" \| "canceled" \| "declined" \| "reverted"; mode: "link" \| "email" \| "user" \| "direct"; direction: "incoming" \| "outgoing"; sender_email: string; ticket_id: string; sender_id: string; expires_at: Date; created_at: Date; updated_at: Date; ticket: { id: string; title: string; reference: string; starts_at: Date; ticket_category_id: string; text?: string; venue?: string; seating?: string; currency?: string; price?: number; ends_at?: Date; }; token?: string; claim_url?: string; recipient_email?: string; recipient_id?: string; accepted_at?: Date; canceled_at?: Date; declined_at?: Date; reverted_at?: Date; }[]; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
