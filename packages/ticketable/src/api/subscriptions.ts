import type { ApiClient, ApiResponse } from "@unidy.io/sdk-api-client";
import { PaginationMetaSchema, type PaginationMeta, buildQueryString } from "@unidy.io/sdk-api-client";
import * as z from "zod";

// Date transformer for ISO8601 strings
const dateTransformer = z.string().datetime().transform((str) => new Date(str));
const nullableDateTransformer = z.string().datetime().nullable().transform((str) => str ? new Date(str) : null);

// Subscription types based on SubscriptionSerializer
const SubscriptionSchema = z.object({
  id: z.string().uuid(), // unidy_id
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
  user_id: z.string().uuid(),
  subscription_category_id: z.string().uuid(),
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

// Get response (just the subscription)
export type SubscriptionGetResponse = Subscription;

// Query params schema with validations
const SubscriptionsListParamsSchema = z.object({
  service_id: z.coerce.number().int().positive(),
  subscription_category_id: z.string().uuid(),
  state: z.string(),
  payment_state: z.string(),
  order_by: z.enum(["starts_at", "ends_at", "reference", "created_at"]),
  order_direction: z.enum(["asc", "desc"]),
  page: z.number().int().min(1),
  limit: z.number().int().min(0).max(250),
}).partial();

export type SubscriptionsListParams = z.input<typeof SubscriptionsListParamsSchema>;

export class SubscriptionsService {
  constructor(private client: ApiClient) {}

  async list(params?: SubscriptionsListParams): Promise<ApiResponse<SubscriptionsListResponse>> {
    // Validate and parse params with Zod
    const validatedParams = params ? SubscriptionsListParamsSchema.parse(params) : undefined;
    const queryString = validatedParams ? buildQueryString(validatedParams) : "";
    const response = await this.client.get<unknown>(`/api/sdk/v1/subscriptions${queryString}`);

    if (!response.success || !response.data) {
      return response as ApiResponse<SubscriptionsListResponse>;
    }

    const parsed = SubscriptionsListResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return {
        ...response,
        success: false,
        error: "Invalid response format",
        data: undefined,
      };
    }

    return {
      ...response,
      data: parsed.data,
    };
  }

  async get(id: string): Promise<ApiResponse<SubscriptionGetResponse>> {
    const response = await this.client.get<unknown>(`/api/sdk/v1/subscriptions/${id}`);

    if (!response.success || !response.data) {
      return response as ApiResponse<SubscriptionGetResponse>;
    }

    const parsed = SubscriptionSchema.safeParse(response.data);
    if (!parsed.success) {
      return {
        ...response,
        success: false,
        error: "Invalid response format",
        data: undefined,
      };
    }

    return {
      ...response,
      data: parsed.data,
    };
  }
}

