import type { ApiClientInterface, CommonErrors, ServiceDependencies } from "../../api/base-service";
import {
  type ExportFormat,
  type ExportLinkResponse,
  ExportLinkResponseSchema,
  SubscriptionSchema,
  SubscriptionsListResponseSchema,
  type Subscription,
  type SubscriptionsListResponse,
} from "./schemas";
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
export type SubscriptionExportLinkResult = CommonErrors | ["missing_id_token", null] | ["unauthorized", null] | ["server_error", null] | ["invalid_response", null] | [null, ExportLinkResponse];

export class SubscriptionsService extends TicketableService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "SubscriptionsService", deps);
  }

  async list(args: SubscriptionsListArgs = {}): Promise<SubscriptionsListResult> {
    const params = this.buildListParams(args, "subscription_category_id", args.subscriptionCategoryId);
    const queryString = this.toQueryString(params);
    return this.handleList("/api/sdk/v1/subscriptions", queryString, SubscriptionsListResponseSchema, "subscriptions", args);
  }

  async get(args: SubscriptionsGetArgs): Promise<SubscriptionsGetResult> {
    return this.handleGet(`/api/sdk/v1/subscriptions/${args.id}`, SubscriptionSchema, "subscription");
  }

  async getExportLink(args: { id: string; format: ExportFormat }): Promise<SubscriptionExportLinkResult> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const response = await this.client.post<unknown>(
      `/api/sdk/v1/subscriptions/${args.id}/export_link`,
      { format: args.format },
      this.buildAuthHeaders({ "X-ID-Token": idToken }),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        if (response.status === 401 || response.status === 403) {
          return ["unauthorized", null];
        }
        return ["server_error", null];
      }

      const parsed = ExportLinkResponseSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid export link response", parsed.error);
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }
}
