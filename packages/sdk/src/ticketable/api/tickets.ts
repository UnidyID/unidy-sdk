import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api";
import { TicketSchema, TicketsListParamsSchema, TicketsListResponseSchema, type Ticket, type TicketsListResponse } from "./schemas";

// Re-export types for external use
export type { Ticket, TicketsListResponse } from "./schemas";

// Argument types for unified interface
export type TicketsListArgs = { page?: number; perPage?: number };
export type TicketsGetArgs = { id: string };

// Result types using tuples
export type TicketsListResult = CommonErrors | ["invalid_response", null] | [null, TicketsListResponse];

export type TicketsGetResult = CommonErrors | ["not_found", null] | ["invalid_response", null] | [null, Ticket];

export class TicketsService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TicketsService", deps);
  }

  async list(args?: TicketsListArgs): Promise<TicketsListResult> {
    const params = args ? { page: args.page?.toString(), per_page: args.perPage?.toString() } : undefined;
    const validatedParams = params ? TicketsListParamsSchema.parse(params) : undefined;
    const queryString = validatedParams ? `?${new URLSearchParams(validatedParams as Record<string, string>).toString()}` : "";

    const response = await this.client.get<unknown>(`/api/sdk/v1/tickets${queryString}`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        throw new Error("Failed to fetch tickets");
      }

      const parsed = TicketsListResponseSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid response format", parsed.error);
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }

  async get(args: TicketsGetArgs): Promise<TicketsGetResult> {
    const { id } = args;
    const response = await this.client.get<unknown>(`/api/sdk/v1/tickets/${id}`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        if (response.status === 404) {
          return ["not_found", null];
        }
        throw new Error("Failed to fetch ticket");
      }

      const parsed = TicketSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid response format", parsed.error);
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }
}
