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
export type SubscriptionsListArgs = { page?: number; perPage?: number };
export type SubscriptionsGetArgs = { id: string };

// Result types using tuples
export type SubscriptionsListResult = CommonErrors | ["invalid_response", null] | [null, SubscriptionsListResponse];

export type SubscriptionsGetResult = CommonErrors | ["not_found", null] | ["invalid_response", null] | [null, Subscription];

export class SubscriptionsService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "SubscriptionsService", deps);
  }

  async list(args?: SubscriptionsListArgs): Promise<SubscriptionsListResult> {
    const params = args ? { page: args.page?.toString(), per_page: args.perPage?.toString() } : undefined;
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
