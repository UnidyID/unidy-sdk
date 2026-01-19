import type { ZodSchema } from "zod";
import { BaseService, type CommonErrors } from "../../api/base-service";
import { TicketableListParamsSchema } from "./schemas";

/** Common list arguments for ticketable services */
export interface TicketableListArgs {
  page?: number;
  perPage?: number;
  state?: string;
  paymentState?: string;
  orderBy?: "starts_at" | "ends_at" | "reference" | "created_at";
  orderDirection?: "asc" | "desc";
  serviceId?: number;
}

/** Result type for list operations */
export type TicketableListResult<T> =
  | CommonErrors
  | ["missing_id_token", null]
  | ["server_error", null]
  | ["invalid_response", null]
  | [null, T];

/** Result type for get operations */
export type TicketableGetResult<T> =
  | CommonErrors
  | ["missing_id_token", null]
  | ["server_error", null]
  | ["not_found", null]
  | ["invalid_response", null]
  | [null, T];

/**
 * Base service for ticketable resources (tickets and subscriptions).
 * Handles common query parameter building and response parsing.
 */
export abstract class TicketableService extends BaseService {
  /**
   * Builds query params from args, mapping camelCase to snake_case.
   * Returns undefined values filtered out.
   */
  protected buildListParams(
    args: TicketableListArgs = {},
    categoryIdKey: string,
    categoryIdValue?: string,
  ): Record<string, string | number | undefined> {
    return {
      page: args.page,
      limit: args.perPage,
      state: args.state,
      payment_state: args.paymentState,
      order_by: args.orderBy,
      order_direction: args.orderDirection,
      service_id: args.serviceId,
      [categoryIdKey]: categoryIdValue,
    };
  }

  /**
   * Converts params to query string, filtering undefined/null and converting to strings.
   */
  protected toQueryString(params: Record<string, string | number | undefined>): string {
    const filtered = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]);

    if (filtered.length === 0) return "";
    return `?${new URLSearchParams(Object.fromEntries(filtered)).toString()}`;
  }

  /**
   * Validates list arguments before making API request.
   * Uses Zod for input validation.
   */
  protected validateListArgs(args: TicketableListArgs): boolean {
    const result = TicketableListParamsSchema.safeParse(args);
    if (!result.success) {
      this.logger.error("Invalid list parameters", result.error);
      return false;
    }
    return true;
  }

  /**
   * Generic list handler with schema validation.
   */
  protected async handleList<T>(
    endpoint: string,
    queryString: string,
    schema: ZodSchema<T>,
    resourceName: string,
    args: TicketableListArgs = {},
  ): Promise<TicketableListResult<T>> {
    // Validate input parameters
    if (!this.validateListArgs(args)) {
      return ["invalid_response", null]; // Invalid input treated same as invalid response
    }

    const idToken = await this.getIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const response = await this.client.get<unknown>(`${endpoint}${queryString}`, this.buildAuthHeaders({ "X-ID-Token": idToken }));

    return this.handleResponse(response, () => {
      if (!response.success) {
        this.logger.error(`Failed to fetch ${resourceName}`, response);
        return ["server_error", null];
      }

      const parsed = schema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid response format", parsed.error);
        this.errorReporter.captureException(parsed.error, { resourceName, endpoint });
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }

  /**
   * Generic get handler with schema validation.
   */
  protected async handleGet<T>(endpoint: string, schema: ZodSchema<T>, resourceName: string): Promise<TicketableGetResult<T>> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const response = await this.client.get<unknown>(endpoint, this.buildAuthHeaders({ "X-ID-Token": idToken }));

    return this.handleResponse(response, () => {
      if (!response.success) {
        if (response.status === 404) {
          return ["not_found", null];
        }
        this.logger.error(`Failed to fetch ${resourceName}`, response);
        return ["server_error", null];
      }

      const parsed = schema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid response format", parsed.error);
        this.errorReporter.captureException(parsed.error, { resourceName, endpoint });
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }
}
