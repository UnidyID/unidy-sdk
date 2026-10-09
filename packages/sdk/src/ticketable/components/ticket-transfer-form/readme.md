# u-ticket-transfer-form



<!-- Auto Generated Below -->


## Overview

Form to offer a ticket to someone else, by email or as a claim link.

Used standalone with an explicit `ticket-id`, or inside a
`u-ticketable-list` ticket template where the list stamps the
`ticket-id` attribute automatically.

## Properties

| Property             | Attribute            | Description                                                                                                   | Type                | Default     |
| -------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------- | ----------- |
| `buttonClassName`    | `button-class-name`  | CSS classes to apply to the submit button element.                                                            | `string`            | `undefined` |
| `componentClassName` | `class-name`         | CSS classes to apply to the form element.                                                                     | `string`            | `undefined` |
| `disabled`           | `disabled`           | Disables the form controls. Stamped automatically on skeleton items inside a u-ticketable-list template.      | `boolean`           | `false`     |
| `errorClassName`     | `error-class-name`   | CSS classes to apply to the error message element.                                                            | `string`            | `undefined` |
| `inputClassName`     | `input-class-name`   | CSS classes to apply to the email input element, and to the claim link field in link mode.                    | `string`            | `undefined` |
| `mode`               | `mode`               | "email" mails the offer to the address entered; "link" creates a claim link to share, shown after submitting. | `"email" \| "link"` | `"email"`   |
| `successClassName`   | `success-class-name` | CSS classes to apply to the success message element.                                                          | `string`            | `undefined` |
| `ticketId`           | `ticket-id`          | The id of the ticket to transfer. Stamped automatically inside a u-ticketable-list template.                  | `string`            | `undefined` |


## Events

| Event                          | Description                                                                                                                | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uTicketTransferCreateError`   | Fired when creating a transfer offer fails. Contains the error code.                                                       | `CustomEvent<{ error: string; }>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `uTicketTransferCreateSuccess` | Fired when a transfer offer was created successfully. Contains the created transfer; a link offer carries its `claim_url`. | `CustomEvent<{ transfer: { id: string; status: "expired" \| "pending" \| "accepted" \| "canceled" \| "declined" \| "reverted"; mode: "link" \| "email" \| "user" \| "direct"; direction: "incoming" \| "outgoing"; sender_email: string; ticket_id: string; sender_id: string; expires_at: Date; created_at: Date; updated_at: Date; ticket: { id: string; title: string; reference: string; starts_at: Date; ticket_category_id: string; text?: string; venue?: string; seating?: string; currency?: string; price?: number; ends_at?: Date; }; token?: string; claim_url?: string; recipient_email?: string; recipient_id?: string; accepted_at?: Date; canceled_at?: Date; declined_at?: Date; reverted_at?: Date; }; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
