import * as z from "zod";
import { TicketableListParamsBaseSchema } from "./schemas";
import { getWithSchema } from "./get-with-schema";
import { type ApiClient, type ApiResponse, type PaginationMeta, PaginationMetaSchema } from "../../api";

// Date transformer for ISO8601 strings
const dateTransformer = z.coerce.date();
const nullableDateTransformer = z.coerce.date().nullable();

// Subscription types based on SubscriptionSerializer
const SubscriptionSchema = z.object({
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

export type Subscription = z.infer<typeof SubscriptionSchema>;

// Re-export PaginationMeta for convenience
export type { PaginationMeta };

// List response
const SubscriptionsListResponseSchema = z.object({
  meta: PaginationMetaSchema,
  results: z.array(SubscriptionSchema),
});

export type SubscriptionsListResponse = z.infer<typeof SubscriptionsListResponseSchema>;

// Query params schema with validations
const SubscriptionsListParamsSchema = TicketableListParamsBaseSchema.extend({ subscription_category_id: z.string().uuid() }).partial();

export type SubscriptionsListParams = z.input<typeof SubscriptionsListParamsSchema>;

export class SubscriptionsService {
  list: (args: object, params?: SubscriptionsListParams) => Promise<ApiResponse<SubscriptionsListResponse>>;
  get: (args: { id: string }) => Promise<ApiResponse<Subscription>>;

  constructor(private client: ApiClient) {
    this.list = getWithSchema(
      this.client,
      SubscriptionsListResponseSchema,
      (_args: unknown) => "/api/sdk/v1/subscriptions",
      SubscriptionsListParamsSchema,
    );

    this.get = getWithSchema(this.client, SubscriptionSchema, (args: { id: string }) => `/api/sdk/v1/subscriptions/${args.id}`);
  }
}
