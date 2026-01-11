import type { ApiClientInterface, ServiceDependencies } from "../../api/base-service";
import { SubscriptionSchema, SubscriptionsListResponseSchema, type Subscription, type SubscriptionsListResponse } from "./schemas";
import { TicketableService, type TicketableListArgs, type TicketableListResult, type TicketableGetResult } from "./ticketable-service";

// Re-export types for external use
export type { Subscription, SubscriptionsListResponse } from "./schemas";

// Argument types extending base ticketable args
export interface SubscriptionsListArgs extends TicketableListArgs {
  subscriptionCategoryId?: string;
}
export type SubscriptionsGetArgs = { id: string };

// Result types
export type SubscriptionsListResult = TicketableListResult<SubscriptionsListResponse>;
export type SubscriptionsGetResult = TicketableGetResult<Subscription>;

export class SubscriptionsService extends TicketableService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "SubscriptionsService", deps);
  }

  async list(args: SubscriptionsListArgs = {}): Promise<SubscriptionsListResult> {
    const params = this.buildListParams(args, "subscription_category_id", args.subscriptionCategoryId);
    const queryString = this.toQueryString(params);
    return this.handleList("/api/sdk/v1/subscriptions", queryString, SubscriptionsListResponseSchema, "subscriptions");
  }

  async get(args: SubscriptionsGetArgs): Promise<SubscriptionsGetResult> {
    return this.handleGet(`/api/sdk/v1/subscriptions/${args.id}`, SubscriptionSchema, "subscription");
  }
}
