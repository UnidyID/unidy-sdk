import type { ApiClientInterface, ServiceDependencies } from "../../api/base-service";

// Re-export types for consumers importing from this module directly.
export type { ExportLink, Ticket, TicketsListResponse } from "./schemas";

import { type ExportFormat, type Ticket, TicketSchema } from "./schemas";
import {
  type TicketableExportLinkResult,
  type TicketableGetResult,
  type TicketableListArgs,
  type TicketableListResult,
  TicketableService,
} from "./ticketable-service";

export interface TicketsListArgs extends TicketableListArgs {
  ticketCategoryId?: string;
}
export type TicketsGetArgs = { id: string };

export type TicketsListResult = TicketableListResult<Ticket>;
export type TicketsGetResult = TicketableGetResult<Ticket>;
export type TicketExportLinkResult = TicketableExportLinkResult;

/** The signed-in user's tickets on the host brand: owned ones, and held ones when ticket transfers are enabled. */
export class TicketsService extends TicketableService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TicketsService", deps);
  }

  async list(args: TicketsListArgs = {}): Promise<TicketsListResult> {
    return this.listTicketables("/tickets", TicketSchema, args, { ticket_category_id: args.ticketCategoryId });
  }

  async get(args: TicketsGetArgs): Promise<TicketsGetResult> {
    return this.fetchRecord(`/tickets/${args.id}`, TicketSchema);
  }

  /** A lent ticket is exported by its holder, not by its owner. */
  async getExportLink(args: { id: string; format: ExportFormat }): Promise<TicketExportLinkResult> {
    return this.exportLink(`/tickets/${args.id}`, args.format);
  }
}
