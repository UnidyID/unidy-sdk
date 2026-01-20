import type { ApiClientInterface, CommonErrors, ServiceDependencies } from "../../api/base-service";
import {
  type ExportFormat,
  type ExportLinkResponse,
  ExportLinkResponseSchema,
  TicketSchema,
  TicketsListResponseSchema,
  type Ticket,
  type TicketsListResponse,
} from "./schemas";
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
export type TicketExportLinkResult = CommonErrors | ["missing_id_token", null] | ["unauthorized", null] | ["server_error", null] | ["invalid_response", null] | [null, ExportLinkResponse];

export class TicketsService extends TicketableService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TicketsService", deps);
  }

  async list(args: TicketsListArgs = {}): Promise<TicketsListResult> {
    const params = this.buildListParams(args, "ticket_category_id", args.ticketCategoryId);
    const queryString = this.toQueryString(params);
    return this.handleList("/api/sdk/v1/tickets", queryString, TicketsListResponseSchema, "tickets", args);
  }

  async get(args: TicketsGetArgs): Promise<TicketsGetResult> {
    return this.handleGet(`/api/sdk/v1/tickets/${args.id}`, TicketSchema, "ticket");
  }

  async getExportLink(args: { id: string; format: ExportFormat }): Promise<TicketExportLinkResult> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const response = await this.client.post<unknown>(
      `/api/sdk/v1/tickets/${args.id}/export_link`,
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
