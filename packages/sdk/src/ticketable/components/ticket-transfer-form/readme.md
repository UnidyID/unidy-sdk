# u-ticket-transfer-form



<!-- Auto Generated Below -->


## Overview

Form to send a ticket transfer offer to an email address.

Used standalone with an explicit `ticket-id`, or inside a
`u-ticketable-list` ticket template where the list stamps the
`ticket-id` attribute automatically.

## Properties

| Property             | Attribute            | Description                                                                                  | Type     | Default     |
| -------------------- | -------------------- | -------------------------------------------------------------------------------------------- | -------- | ----------- |
| `buttonClassName`    | `button-class-name`  | CSS classes to apply to the submit button element.                                           | `string` | `undefined` |
| `componentClassName` | `class-name`         | CSS classes to apply to the form element.                                                    | `string` | `undefined` |
| `errorClassName`     | `error-class-name`   | CSS classes to apply to the error message element.                                           | `string` | `undefined` |
| `inputClassName`     | `input-class-name`   | CSS classes to apply to the email input element.                                             | `string` | `undefined` |
| `successClassName`   | `success-class-name` | CSS classes to apply to the success message element.                                         | `string` | `undefined` |
| `ticketId`           | `ticket-id`          | The id of the ticket to transfer. Stamped automatically inside a u-ticketable-list template. | `string` | `undefined` |


## Events

| Event                          | Description                                                                       | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uTicketTransferCreateError`   | Fired when sending a transfer offer fails. Contains the error code.               | `CustomEvent<{ error: string; }>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `uTicketTransferCreateSuccess` | Fired when a transfer offer was sent successfully. Contains the created transfer. | `CustomEvent<{ transfer: { token: string; status: "expired" \| "pending" \| "accepted" \| "canceled" \| "declined"; recipient_email: string; sender_email: string; expires_at: Date; created_at: Date; ticket: { id: string; title: string; reference: string; exportable_to_wallet: boolean; state: string; created_at: Date; updated_at: Date; user_id: string; starts_at: Date; ticket_category_id: string; metadata?: JSONType; wallet_export?: JSONType; payment_state?: string; currency?: string; button_cta_url?: string; text?: string; info_banner?: string; seating?: string; venue?: string; ends_at?: Date; price?: number; }; }; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
