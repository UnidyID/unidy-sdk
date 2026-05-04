import type { ZodSchema } from "zod";
import { BaseService, type CommonErrors } from "../../api/base-service";
import { type TransactionListParams, TransactionListParamsSchema } from "./schemas";

/** Common list arguments for transaction services */
export type TransactionListArgs = TransactionListParams;

/** Result type for list operations */
export type TransactionListResult<T> =
  | CommonErrors
  | ["missing_id_token", null]
  | ["server_error", null]
  | ["invalid_response", null]
  | [null, T];

/** Result type for get operations */
export type TransactionGetResult<T> =
  | CommonErrors
  | ["missing_id_token", null]
  | ["server_error", null]
  | ["not_found", null]
  | ["invalid_response", null]
  | [null, T];

/**
 * Base service for transaction resources.
 * Handles common query parameter building and response parsing.
 */
export abstract class TransactionService extends BaseService {
  /**
   * Builds query params from args, mapping camelCase to snake_case.
   * Undefined/null values are filtered out by toQueryString.
   */
  protected buildListParams(args: TransactionListArgs = {}): Record<string, string | number | undefined> {
    return {
      page: args.page,
      limit: args.perPage,
      state: args.state ?? undefined,
      financial_status: args.financialStatus ?? undefined,
      order_type: args.orderType ?? undefined,
      source_platform: args.sourcePlatform ?? undefined,
      external_id: args.externalId ?? undefined,
      order_by: args.orderBy,
      order_direction: args.orderDirection,
    };
  }

  /** Converts params to query string, filtering undefined/null and coercing to strings. */
  protected toQueryString(params: Record<string, string | number | undefined>): string {
    const filtered = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]);

    if (filtered.length === 0) return "";
    return `?${new URLSearchParams(Object.fromEntries(filtered)).toString()}`;
  }

  /** Validates list arguments before making API request. */
  protected validateListArgs(args: TransactionListArgs): boolean {
    const result = TransactionListParamsSchema.safeParse(args);
    if (!result.success) {
      this.logger.error("Invalid list parameters", result.error);
      return false;
    }
    return true;
  }

  /** Generic list handler with schema validation. */
  protected async handleList<T>(
    endpoint: string,
    queryString: string,
    schema: ZodSchema<T>,
    resourceName: string,
    args: TransactionListArgs = {},
  ): Promise<TransactionListResult<T>> {
    if (!this.validateListArgs(args)) {
      return ["invalid_response", null];
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

  /** Generic get handler with schema validation. */
  protected async handleGet<T>(endpoint: string, schema: ZodSchema<T>, resourceName: string): Promise<TransactionGetResult<T>> {
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
