import * as z from "zod";
import { TicketableListParamsBaseSchema } from "./schemas";
import { type ApiClientInterface, PaginationMetaSchema, BaseService, type CommonErrors, type ServiceDependencies } from "../../api";

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

// List response
const SubscriptionsListResponseSchema = z.object({
  meta: PaginationMetaSchema,
  results: z.array(SubscriptionSchema),
});

export type SubscriptionsListResponse = z.infer<typeof SubscriptionsListResponseSchema>;

// Query params schema with validations
const SubscriptionsListParamsSchema = TicketableListParamsBaseSchema.extend({ subscription_category_id: z.string().uuid() }).partial();

export type SubscriptionsListParams = z.input<typeof SubscriptionsListParamsSchema>;

// Result types using tuples
export type ListTicketableSubscriptionsResult = CommonErrors | ["invalid_response", null] | [null, SubscriptionsListResponse];

export type GetTicketableSubscriptionResult = CommonErrors | ["not_found", null] | ["invalid_response", null] | [null, Subscription];

export class SubscriptionsService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "SubscriptionsService", deps);
  }

  async list(params?: SubscriptionsListParams): Promise<ListTicketableSubscriptionsResult> {
    const validatedParams = params ? SubscriptionsListParamsSchema.parse(params) : undefined;
    const queryString = validatedParams ? `?${new URLSearchParams(validatedParams as Record<string, string>).toString()}` : "";

    const response = await this.client.get<unknown>(`/api/sdk/v1/subscriptions${queryString}`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        throw new Error("Failed to fetch subscriptions");
      }

      const parsed = SubscriptionsListResponseSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid response format", parsed.error);
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }

  async get(id: string): Promise<GetTicketableSubscriptionResult> {
    const response = await this.client.get<unknown>(`/api/sdk/v1/subscriptions/${id}`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        if (response.status === 404) {
          return ["not_found", null];
        }
        throw new Error("Failed to fetch subscription");
      }

      const parsed = SubscriptionSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid response format", parsed.error);
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }
}
