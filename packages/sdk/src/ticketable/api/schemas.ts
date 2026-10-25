import * as z from "zod";
import type { Page } from "../../api/shared";

// Date transformer for ISO8601 strings
const dateTransformer = z.coerce.date();
const nullableDateTransformer = z.coerce.date().nullable();

export const ExportFormat = z.enum(["pdf", "pkpass"]);
export type ExportFormat = z.infer<typeof ExportFormat>;

/** A short-lived download link for a ticket's or subscription's PDF or wallet pass. */
export const ExportLinkSchema = z.object({
  format: ExportFormat,
  download_url: z.url(),
  expires_at: dateTransformer,
});
export type ExportLink = z.infer<typeof ExportLinkSchema>;

// Input validation schemas for ticketable list parameters
export const TicketableListParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().max(500).optional(),
  state: z.string().nullish(),
  paymentState: z.string().nullish(),
  orderBy: z.enum(["starts_at", "ends_at", "reference", "created_at"]).optional(),
  orderDirection: z.enum(["asc", "desc"]).optional(),
});

// `metadata` and `wallet_export` are Postgres `jsonb` columns. The column type
// permits any JSON value (object, array, primitive, null) and Alba forwards it
// verbatim, so the schema has to match — `z.record(string, unknown)` rejected
// the non-object shapes legacy records carry (`[]`, `false`, plain strings).
// `z.json()` already includes `null` per the JSON spec; no `.nullable()` needed.
const jsonbValue = z.json();

export const TicketableSchema = z.object({
  id: z.uuid(), // unidy_id
  title: z.string(),
  reference: z.string(),
  exportable_to_wallet: z.boolean(),
  state: z.string(),
  created_at: dateTransformer, // ISO8601(3) -> Date
  updated_at: dateTransformer, // ISO8601(3) -> Date
  user_id: z.uuid(),
  metadata: jsonbValue,
  wallet_export: jsonbValue,
  /** `paid` or `not_paid`. */
  payment_state: z.string().nullable(),
  currency: z.string().nullable(),
  button_cta_url: z.string().nullable(),
});

// Ticket schema based on V2::Me::TicketSerializer
export const TicketSchema = TicketableSchema.extend({
  text: z.string().nullable(),
  info_banner: z.string().nullable(),
  seating: z.string().nullable(),
  venue: z.string().nullable(),
  starts_at: dateTransformer, // ISO8601(3) -> Date
  ends_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  entered_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  price: z.number().nullable(), // decimal(8, 2) -> float
  ticket_category_id: z.uuid(),
  // Non-null when the ticket has been transferred to another user (holder_id ≠ user_id).
  // wallet_export / metadata are null and exportable_to_wallet is false in that state.
  holder_id: z.uuid().nullable().optional(),
});

// Subscription schema based on V2::SubscriptionSerializer
export const SubscriptionSchema = TicketableSchema.extend({
  text: z.string().nullable(),
  payment_frequency: z.string().nullable(),
  starts_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  ends_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  next_payment_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  price: z.number().nullable(), // decimal(8, 2) -> float
  subscription_category_id: z.uuid(),
});

// Ticket transfer schemas based on V2::Me::TicketTransferSerializer
export const TicketTransferStatusSchema = z.enum(["pending", "accepted", "canceled", "declined", "expired", "reverted"]);

/** How an offer is addressed: mailed (`email`), a bare claim link (`link`), bound to an account (`user`), or an admin assignment (`direct`). */
export const TicketTransferModeSchema = z.enum(["email", "link", "user", "direct"]);

/** Which side of the offer the signed-in user is on. */
export const TicketTransferDirectionSchema = z.enum(["incoming", "outgoing"]);

/** The offered ticket as its recipient sees it: without `metadata` and `wallet_export`, which carry the entry credentials. */
export const OfferedTicketSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  text: z.string().nullable(),
  reference: z.string(),
  venue: z.string().nullable(),
  seating: z.string().nullable(),
  currency: z.string().nullable(),
  price: z.number().nullable(),
  starts_at: dateTransformer, // ISO8601(3) -> Date
  ends_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  ticket_category_id: z.uuid(),
});

export const TicketTransferSchema = z.object({
  id: z.uuid(),
  status: TicketTransferStatusSchema,
  mode: TicketTransferModeSchema,
  // Only the sender sees the token and the claim link.
  token: z.string().nullable(),
  claim_url: z.string().nullable(),
  // Null for a link offer.
  recipient_email: z.string().nullable(),
  direction: TicketTransferDirectionSchema,
  sender_email: z.string(),
  ticket_id: z.uuid(),
  sender_id: z.uuid(),
  recipient_id: z.uuid().nullable(),
  expires_at: dateTransformer, // ISO8601(3) -> Date
  accepted_at: nullableDateTransformer,
  canceled_at: nullableDateTransformer,
  declined_at: nullableDateTransformer,
  reverted_at: nullableDateTransformer,
  created_at: dateTransformer,
  updated_at: dateTransformer,
  ticket: OfferedTicketSchema,
});

// Export types
export type Ticket = z.infer<typeof TicketSchema>;
export type TicketsListResponse = Page<Ticket>;

export type Subscription = z.infer<typeof SubscriptionSchema>;
export type SubscriptionsListResponse = Page<Subscription>;

export type TicketTransfer = z.infer<typeof TicketTransferSchema>;
export type TicketTransferStatus = z.infer<typeof TicketTransferStatusSchema>;
export type TicketTransferMode = z.infer<typeof TicketTransferModeSchema>;
export type TicketTransferDirection = z.infer<typeof TicketTransferDirectionSchema>;
export type OfferedTicket = z.infer<typeof OfferedTicketSchema>;

export type TicketableListParams = z.infer<typeof TicketableListParamsSchema>;
