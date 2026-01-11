import type { ApiClientInterface, ServiceDependencies } from "../../api/base-service";
import { TicketSchema, TicketsListResponseSchema, type Ticket, type TicketsListResponse } from "./schemas";
import { TicketableService, type TicketableListArgs, type TicketableListResult, type TicketableGetResult } from "./ticketable-service";

// Re-export types for external use
export type { Ticket, TicketsListResponse } from "./schemas";

// Argument types extending base ticketable args
export interface TicketsListArgs extends TicketableListArgs {
  ticketCategoryId?: string;
}
export type TicketsGetArgs = { id: string };

// Result types
export type TicketsListResult = TicketableListResult<TicketsListResponse>;
export type TicketsGetResult = TicketableGetResult<Ticket>;

export class TicketsService extends TicketableService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TicketsService", deps);
  }

  async list(args: TicketsListArgs = {}): Promise<TicketsListResult> {
    const params = this.buildListParams(args, "ticket_category_id", args.ticketCategoryId);
    const queryString = this.toQueryString(params);
    return this.handleList("/api/sdk/v1/tickets", queryString, TicketsListResponseSchema, "tickets");
  }

  async get(args: TicketsGetArgs): Promise<TicketsGetResult> {
    return this.handleGet(`/api/sdk/v1/tickets/${args.id}`, TicketSchema, "ticket");
  }
}
