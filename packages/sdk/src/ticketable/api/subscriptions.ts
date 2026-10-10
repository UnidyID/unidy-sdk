import type { ApiClientInterface, ServiceDependencies } from "../../api/base-service";

// Re-export types for consumers importing from this module directly.
export type { Subscription, SubscriptionsListResponse } from "./schemas";

import { type ExportFormat, type Subscription, SubscriptionSchema } from "./schemas";
import {
  type TicketableExportLinkResult,
  type TicketableGetResult,
  type TicketableListArgs,
  type TicketableListResult,
  TicketableService,
} from "./ticketable-service";

export interface SubscriptionsListArgs extends TicketableListArgs {
  subscriptionCategoryId?: string;
}
export type SubscriptionsGetArgs = { id: string };

export type SubscriptionsListResult = TicketableListResult<Subscription>;
export type SubscriptionsGetResult = TicketableGetResult<Subscription>;
export type SubscriptionExportLinkResult = TicketableExportLinkResult;

/** The signed-in user's visible subscriptions on the host brand. */
export class SubscriptionsService extends TicketableService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "SubscriptionsService", deps);
  }

  async list(args: SubscriptionsListArgs = {}): Promise<SubscriptionsListResult> {
    return this.listTicketables("/subscriptions", SubscriptionSchema, args, {
      subscription_category_id: args.subscriptionCategoryId,
    });
  }

  async get(args: SubscriptionsGetArgs): Promise<SubscriptionsGetResult> {
    return this.fetchRecord(`/subscriptions/${args.id}`, SubscriptionSchema);
  }

  async getExportLink(args: { id: string; format: ExportFormat }): Promise<SubscriptionExportLinkResult> {
    return this.exportLink(`/subscriptions/${args.id}`, args.format);
  }
}
