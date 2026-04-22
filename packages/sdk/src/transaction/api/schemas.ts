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
  id: z.string(),
  description: z.string().nullable(),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
  total: z.number().nullable(),
  currency: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export const TransactionSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  external_id: z.string().nullable(),
  reference: z.string().nullable(),
  source_platform: z.string().nullable(),
  order_type: z.string().nullable(),
  state: z.string().nullable(),
  financial_status: z.string().nullable(),
  currency: z.string().nullable(),
  total: z.number().nullable(),
  placed_at: nullableDateTransformer,
  created_at: dateTransformer,
  updated_at: dateTransformer,
  metadata: z.record(z.string(), z.unknown()).nullable(),
  line_items: z.array(TransactionLineItemSchema).default([]),
});

export const TransactionsListResponseSchema = z.object({
  meta: PaginationMetaSchema,
  results: z.array(TransactionSchema),
});

export type TransactionLineItem = z.infer<typeof TransactionLineItemSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionsListResponse = z.infer<typeof TransactionsListResponseSchema>;
export type TransactionListParams = z.infer<typeof TransactionListParamsSchema>;
