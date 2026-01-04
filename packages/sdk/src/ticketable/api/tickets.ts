import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api";
import { TicketSchema, TicketsListParamsSchema, TicketsListResponseSchema, type Ticket, type TicketsListResponse } from "./schemas";

// Re-export types for external use
export type { Ticket, TicketsListResponse } from "./schemas";

// Argument types for unified interface
export type TicketsListArgs = {
  page?: number;
  perPage?: number;
  state?: string;
  paymentState?: string;
  orderBy?: "starts_at" | "ends_at" | "reference" | "created_at";
  orderDirection?: "asc" | "desc";
  serviceId?: number;
  ticketCategoryId?: string;
};
export type TicketsGetArgs = { id: string };

// Result types using tuples
export type TicketsListResult = CommonErrors | ["server_error", null] | ["invalid_response", null] | [null, TicketsListResponse];

export type TicketsGetResult = CommonErrors | ["server_error", null] | ["not_found", null] | ["invalid_response", null] | [null, Ticket];

export class TicketsService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TicketsService", deps);
  }

  async list(args?: TicketsListArgs): Promise<TicketsListResult> {
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
          ticket_category_id: args.ticketCategoryId,
        }
      : undefined;

    // Validate params against schema (expects numbers for page/limit)
    const validatedParams = params ? TicketsListParamsSchema.safeParse(params) : undefined;
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

    const response = await this.client.get<unknown>(`/api/sdk/v1/tickets${queryString}`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        this.logger.error("Failed to fetch tickets", response);
        return ["server_error", null];
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
        this.logger.error("Failed to fetch ticket", response);
        return ["server_error", null];
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
