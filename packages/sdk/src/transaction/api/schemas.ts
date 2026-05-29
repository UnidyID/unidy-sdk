import * as z from "zod";
import { PaginationMetaSchema } from "../../api/shared";

// Input validation schema for transaction list parameters
export const TransactionListParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().max(250).optional(),
  state: z.string().nullish(),
  financialStatus: z.string().nullish(),
  orderType: z.string().nullish(),
  sourcePlatform: z.string().nullish(),
  externalId: z.string().nullish(),
  orderBy: z.enum(["placed_at", "created_at", "total"]).optional(),
  orderDirection: z.enum(["asc", "desc"]).optional(),
});

// Date transformers for ISO8601 strings
const dateTransformer = z.coerce.date();
const nullableDateTransformer = z.coerce.date().nullable();

export const TransactionLineItemSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
  total_price: z.number().nullable(),
  // Currency is intentionally omitted: the backend exposes it on the parent
  // transaction only. Consumers should fall back to `transaction.currency`.
  // User-supplied JSON — the backend does not enforce an object shape, so we
  // accept any value (object, array, scalar, null) instead of z.record(...).
  metadata: z.unknown().nullable().optional(),
});

export const AddressSchema = z.object({
  salutation: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  company_name: z.string().nullable(),
  address_line_1: z.string().nullable(),
  address_line_2: z.string().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable(),
  country_code: z.string().nullable(),
  phone_number: z.string().nullable(),
});

export const TransactionSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  transaction_category_id: z.uuid(),
  external_id: z.string().nullable(),
  reference: z.string().nullable(),
  source_platform: z.string().nullable(),
  order_type: z.string().nullable(),
  state: z.string().nullable(),
  financial_status: z.string().nullable(),
  fulfillment_status: z.string().nullable(),
  currency: z.string().nullable(),
  payment_method: z.string().nullable(),
  payment_provider_ref: z.string().nullable(),
  coupon_code: z.string().nullable(),
  invoice_number: z.string().nullable(),
  cancel_reason: z.string().nullable(),
  customer_note: z.string().nullable(),
  staff_note: z.string().nullable(),
  source_channel_id: z.string().nullable(),
  prices_include_tax: z.boolean(),
  tax_exempt: z.boolean(),
  tags: z.array(z.string()).default([]),
  total: z.number().nullable(),
  subtotal: z.number().nullable(),
  total_discount: z.number().nullable(),
  total_paid: z.number().nullable(),
  total_refunded: z.number().nullable(),
  total_shipping: z.number().nullable(),
  total_tax: z.number().nullable(),
  exchange_rate: z.number().nullable(),
  placed_at: nullableDateTransformer,
  cancelled_at: nullableDateTransformer,
  completed_at: nullableDateTransformer,
  created_at: dateTransformer,
  updated_at: dateTransformer,
  // User-supplied JSON — the backend does not enforce an object shape, so we
  // accept any value (object, array, scalar, null) instead of z.record(...).
  metadata: z.unknown().nullable().optional(),
  // User-supplied JSON from the source platform.
  platform_metadata: z.unknown().nullable().optional(),
  billing_address: AddressSchema.nullable(),
  shipping_address: AddressSchema.nullable(),
  line_items: z.array(TransactionLineItemSchema).default([]),
});

export const TransactionsListResponseSchema = z.object({
  meta: PaginationMetaSchema,
  results: z.array(TransactionSchema),
});

export type Address = z.infer<typeof AddressSchema>;
export type TransactionLineItem = z.infer<typeof TransactionLineItemSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionsListResponse = z.infer<typeof TransactionsListResponseSchema>;
export type TransactionListParams = z.infer<typeof TransactionListParamsSchema>;
