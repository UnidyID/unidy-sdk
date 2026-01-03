import * as z from "zod";
import { PaginationParamsSchema, PaginationMetaSchema } from "../../api/shared";

// Base params schema for ticketable list queries
export const TicketableListParamsBaseSchema = z
  .object({
    service_id: z.number().nullable(),
    state: z.string(),
    payment_state: z.string(),
    order_by: z.enum(["starts_at", "ends_at", "reference", "created_at"]),
    order_direction: z.enum(["asc", "desc"]),
  })
  .merge(PaginationParamsSchema);

// Date transformer for ISO8601 strings
const dateTransformer = z.coerce.date();
const nullableDateTransformer = z.coerce.date().nullable();

// Ticket schema based on TicketSerializer
export const TicketSchema = z.object({
  id: z.uuid(), // unidy_id
  title: z.string(),
  text: z.string().nullable(),
  reference: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  wallet_export: z.record(z.string(), z.unknown()).nullable(),
  state: z.string(),
  payment_state: z.string().nullable(),
  button_cta_url: z.string().nullable(),
  info_banner: z.string().nullable(),
  seating: z.string().nullable(),
  venue: z.string().nullable(),
  currency: z.string().nullable(),
  starts_at: dateTransformer, // ISO8601(3) -> Date
  ends_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  created_at: dateTransformer, // ISO8601(3) -> Date
  updated_at: dateTransformer, // ISO8601(3) -> Date
  price: z.number(), // decimal(8, 2) -> float
  user_id: z.uuid(),
  ticket_category_id: z.uuid(),
});

// Tickets list response schema
export const TicketsListResponseSchema = z.object({
  meta: PaginationMetaSchema,
  results: z.array(TicketSchema),
});

// Tickets list params schema
export const TicketsListParamsSchema = TicketableListParamsBaseSchema.extend({
  ticket_category_id: z.string().uuid(),
}).partial();

// Subscription schema based on SubscriptionSerializer
export const SubscriptionSchema = z.object({
  id: z.uuid(), // unidy_id
  title: z.string(),
  text: z.string(),
  payment_frequency: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  wallet_export: z.record(z.string(), z.unknown()).nullable(),
  state: z.string(),
  reference: z.string(),
  payment_state: z.string().nullable(),
  currency: z.string().nullable(),
  button_cta_url: z.string().nullable(),
  created_at: dateTransformer, // ISO8601(3) -> Date
  updated_at: dateTransformer, // ISO8601(3) -> Date
  starts_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  ends_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  next_payment_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  price: z.number(), // decimal(8, 2) -> float
  user_id: z.uuid(),
  subscription_category_id: z.uuid(),
});

// Subscriptions list response schema
export const SubscriptionsListResponseSchema = z.object({
  meta: PaginationMetaSchema,
  results: z.array(SubscriptionSchema),
});

// Subscriptions list params schema
export const SubscriptionsListParamsSchema = TicketableListParamsBaseSchema.extend({
  subscription_category_id: z.string().uuid(),
}).partial();

// Export types
export type Ticket = z.infer<typeof TicketSchema>;
export type TicketsListResponse = z.infer<typeof TicketsListResponseSchema>;
export type TicketsListParams = z.input<typeof TicketsListParamsSchema>;

export type Subscription = z.infer<typeof SubscriptionSchema>;
export type SubscriptionsListResponse = z.infer<typeof SubscriptionsListResponseSchema>;
export type SubscriptionsListParams = z.input<typeof SubscriptionsListParamsSchema>;
