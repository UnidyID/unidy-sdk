import * as z from "zod";
import { PaginationMetaSchema } from "../../api/shared";

// Input validation schemas for ticketable list parameters
export const TicketableListParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().max(250).optional(),
  state: z.string().nullish(),
  paymentState: z.string().nullish(),
  orderBy: z.enum(["starts_at", "ends_at", "reference", "created_at"]).optional(),
  orderDirection: z.enum(["asc", "desc"]).optional(),
  serviceId: z.number().int().positive().optional(),
});

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

// Export types
export type Ticket = z.infer<typeof TicketSchema>;
export type TicketsListResponse = z.infer<typeof TicketsListResponseSchema>;

export type Subscription = z.infer<typeof SubscriptionSchema>;
export type SubscriptionsListResponse = z.infer<typeof SubscriptionsListResponseSchema>;

export type TicketableListParams = z.infer<typeof TicketableListParamsSchema>;
