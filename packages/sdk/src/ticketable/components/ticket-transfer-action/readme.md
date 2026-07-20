# u-ticket-transfer-action



<!-- Auto Generated Below -->


## Overview

Button performing an action on a pending ticket transfer.

Used standalone with an explicit `token`, or inside a
`u-ticket-transfer-list` template where the list stamps the `token`
attribute automatically and refetches when the action succeeds.

## Properties

| Property              | Attribute    | Description                                                                                         | Type                                | Default     |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------- |
| `action` _(required)_ | `action`     | The action this button performs: "accept" or "decline" an incoming offer, "cancel" an outgoing one. | `"accept" \| "cancel" \| "decline"` | `undefined` |
| `componentClassName`  | `class-name` | CSS classes to apply to the button element.                                                         | `string`                            | `undefined` |
| `token`               | `token`      | The transfer token. Stamped automatically inside a u-ticket-transfer-list template.                 | `string`                            | `undefined` |


## Events

| Event                          | Description                                                                                 | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `uTicketTransferActionError`   | Fired when the action fails. Contains the action and the error code.                        | `CustomEvent<{ action: TicketTransferActionType; error: string; }>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `uTicketTransferActionSuccess` | Fired when the action completes successfully. Contains the action and the updated transfer. | `CustomEvent<{ action: TicketTransferActionType; transfer: { token: string; status: "expired" \| "pending" \| "accepted" \| "canceled" \| "declined"; recipient_email: string; sender_email: string; expires_at: Date; created_at: Date; ticket: { id: string; title: string; reference: string; exportable_to_wallet: boolean; state: string; created_at: Date; updated_at: Date; user_id: string; starts_at: Date; ticket_category_id: string; metadata?: JSONType; wallet_export?: JSONType; payment_state?: string; currency?: string; button_cta_url?: string; text?: string; info_banner?: string; seating?: string; venue?: string; ends_at?: Date; price?: number; }; }; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
