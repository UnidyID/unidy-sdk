import type { ApiResponse } from "../../api/base-client";
import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api/base-service";
import {
  type BrandConnection,
  BrandConnectionErrorResponseSchema,
  BrandConnectionSchema,
  BrandConnectionsListResponseSchema,
  type BrandConnectionErrorResponse,
} from "./schemas";

export type { BrandConnection, BrandConnectionErrorResponse } from "./schemas";
export { BrandConnectionErrorResponseSchema, BrandConnectionSchema, BrandConnectionsListResponseSchema } from "./schemas";

const BRAND_CONNECTION_ERROR_IDENTIFIERS = [
  "brand_not_found",
  "brand_connection_not_found",
  "brand_already_connected",
  "protected_brand_cannot_be_connected",
  "protected_brand_cannot_be_disconnected",
  "brand_connection_failed",
  "unprocessable_content",
  "missing_api_key",
  "invalid_api_key",
  "missing_id_token",
  "invalid_id_token",
  "expired_id_token",
  "origin_not_allowed",
  "real_email_required",
  "not_found",
  "rate_limit_exceeded",
  "internal_server_error",
] as const;

export type BrandConnectionErrorIdentifier = (typeof BRAND_CONNECTION_ERROR_IDENTIFIERS)[number];
export type BrandConnectionArgs = { brandId: number };

export type BrandConnectionError =
  | CommonErrors
  | ["missing_id_token", null]
  | [BrandConnectionErrorIdentifier, BrandConnectionErrorResponse]
  | ["api_error", BrandConnectionErrorResponse]
  | ["invalid_response", null];

export type BrandConnectionsListResult = BrandConnectionError | [null, BrandConnection[]];
export type BrandConnectionCreateResult = BrandConnectionError | [null, BrandConnection];
export type BrandConnectionDestroyResult = BrandConnectionError | [null, null];

export class BrandConnectionsService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "BrandConnectionsService", deps);
  }

  /** Lists brands available to the SDK client and their connection state for the authenticated user. */
  async list(): Promise<BrandConnectionsListResult> {
    const idToken = await this.resolveIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const endpoint = "/api/sdk/v1/brand_connections";
    const response = await this.client.get<unknown>(endpoint, this.authHeaders(idToken));

    return this.handleResponse(response, () => {
      if (!response.success) {
        return this.errorResult(response, endpoint);
      }

      const parsed = BrandConnectionsListResponseSchema.safeParse(response.data);
      if (!parsed.success) {
        return this.invalidResponse(parsed.error, endpoint);
      }

      return [null, parsed.data];
    });
  }

  /** Connects the authenticated user to an eligible brand. */
  async connect(args: BrandConnectionArgs): Promise<BrandConnectionCreateResult> {
    const idToken = await this.resolveIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const endpoint = "/api/sdk/v1/brand_connections";
    const response = await this.client.post<unknown>(endpoint, { brand_id: args.brandId }, this.authHeaders(idToken));

    return this.handleResponse(response, () => {
      if (!response.success) {
        return this.errorResult(response, endpoint);
      }

      const parsed = BrandConnectionSchema.safeParse(response.data);
      if (!parsed.success) {
        return this.invalidResponse(parsed.error, endpoint);
      }

      return [null, parsed.data];
    });
  }

  /** Disconnects an existing non-current, non-default brand connection. */
  async disconnect(args: BrandConnectionArgs): Promise<BrandConnectionDestroyResult> {
    const idToken = await this.resolveIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const endpoint = `/api/sdk/v1/brand_connections/${encodeURIComponent(String(args.brandId))}`;
    const response = await this.client.delete<unknown>(endpoint, this.authHeaders(idToken));

    return this.handleResponse(response, () => {
      if (!response.success) {
        return this.errorResult(response, endpoint);
      }

      return [null, null];
    });
  }

  private authHeaders(idToken: string): HeadersInit | undefined {
    return this.buildAuthHeaders({ "X-ID-Token": idToken });
  }

  private async resolveIdToken(): Promise<string | null> {
    try {
      return await this.getIdToken();
    } catch (error) {
      this.logger.error("Failed to resolve ID token", error);
      return null;
    }
  }

  private errorResult(
    response: ApiResponse<unknown>,
    endpoint: string,
  ):
    | [BrandConnectionErrorIdentifier, BrandConnectionErrorResponse]
    | ["api_error", BrandConnectionErrorResponse]
    | ["invalid_response", null] {
    const parsed = BrandConnectionErrorResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return this.invalidResponse(parsed.error, endpoint);
    }

    if ((BRAND_CONNECTION_ERROR_IDENTIFIERS as readonly string[]).includes(parsed.data.error_identifier)) {
      return [parsed.data.error_identifier as BrandConnectionErrorIdentifier, parsed.data];
    }

    return ["api_error", parsed.data];
  }

  private invalidResponse(error: unknown, endpoint: string): ["invalid_response", null] {
    this.logger.error("Invalid brand connection response", error);
    this.errorReporter.captureException(error, { endpoint });
    return ["invalid_response", null];
  }
}
