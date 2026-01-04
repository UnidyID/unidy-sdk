import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api";
import {
  SubscriptionSchema,
  SubscriptionsListParamsSchema,
  SubscriptionsListResponseSchema,
  type Subscription,
  type SubscriptionsListResponse,
} from "./schemas";

// Re-export types for external use
export type { Subscription, SubscriptionsListResponse } from "./schemas";

// Argument types for unified interface
export type SubscriptionsListArgs = {
  page?: number;
  perPage?: number;
  state?: string;
  paymentState?: string;
  orderBy?: "starts_at" | "ends_at" | "reference" | "created_at";
  orderDirection?: "asc" | "desc";
  serviceId?: number;
  subscriptionCategoryId?: string;
};
export type SubscriptionsGetArgs = { id: string };

// Result types using tuples
export type SubscriptionsListResult = CommonErrors | ["invalid_response", null] | [null, SubscriptionsListResponse];

export type SubscriptionsGetResult = CommonErrors | ["not_found", null] | ["invalid_response", null] | [null, Subscription];

export class SubscriptionsService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "SubscriptionsService", deps);
  }

  async list(args?: SubscriptionsListArgs): Promise<SubscriptionsListResult> {
    // Build params object with correct field names for schema validation
    const params = args
      ? {
          page: args.page,
          limit: args.perPage,
          state: args.state,
          payment_state: args.paymentState,
          order_by: args.orderBy,
          order_direction: args.orderDirection,
          service_id: args.serviceId,
          subscription_category_id: args.subscriptionCategoryId,
        }
      : undefined;

    // Validate params against schema (expects numbers for page/limit)
    const validatedParams = params ? SubscriptionsListParamsSchema.safeParse(params) : undefined;
    const validParams = validatedParams?.success ? validatedParams.data : params;

    // Filter out undefined values and convert to strings for URL
    const queryParams = validParams
      ? Object.fromEntries(
          Object.entries(validParams)
            .filter(([_, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)]),
        )
      : undefined;
    const queryString = queryParams && Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : "";

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

  async get(args: SubscriptionsGetArgs): Promise<SubscriptionsGetResult> {
    const { id } = args;
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
