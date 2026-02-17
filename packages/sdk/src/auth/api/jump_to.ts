import type { ApiClientInterface } from "../../api/base-service";
import {
  type ErrorResponse,
  JumpToServiceErrorSchema,
  type JumpToServiceRequest,
  JumpToServiceRequestSchema,
  JumpToServiceResponseSchema,
  JumpToUnidyErrorSchema,
  type JumpToUnidyRequest,
  JumpToUnidyRequestSchema,
  JumpToUnidyResponseSchema,
} from "./schemas";
import { type CommonErrors, handleResponse } from "./shared";

// ============================================
// Result types
// ============================================

export type JumpToServiceResult =
  | CommonErrors
  | ["user_not_found", ErrorResponse]
  | ["application_not_found", ErrorResponse]
  | ["invalid_redirect_uri", ErrorResponse]
  | ["invalid_scope", ErrorResponse]
  | [null, string];

export type JumpToUnidyResult = CommonErrors | ["user_not_found", ErrorResponse] | ["invalid_path", ErrorResponse] | [null, string];

// ============================================
// Jump-to API functions
// ============================================

/**
 * Create a one-time login token for jumping to an external OAuth service.
 * Requires user to be authenticated (ID token in cookie or header).
 */
export async function jumpToService(
  client: ApiClientInterface,
  serviceId: string,
  request: JumpToServiceRequest,
): Promise<JumpToServiceResult> {
  const validatedRequest = JumpToServiceRequestSchema.parse(request);
  const response = await client.post<unknown>(`/api/sdk/v1/jump_to/service/${serviceId}`, validatedRequest);

  return handleResponse(response, () => {
    if (!response.success) {
      const errorParse = JumpToServiceErrorSchema.safeParse(response.data);
      if (errorParse.success) {
        const errorIdentifier = errorParse.data.error_identifier;
        return [
          errorIdentifier as "user_not_found" | "application_not_found" | "invalid_redirect_uri" | "invalid_scope",
          { error_identifier: errorIdentifier },
        ];
      }

      return ["user_not_found", { error_identifier: "unknown_error" }];
    }

    const parsed = JumpToServiceResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return ["schema_validation_error", { error_identifier: "schema_validation_error", errors: [] }];
    }

    return [null, parsed.data.token];
  });
}

/**
 * Create a one-time login token for jumping to an internal Unidy path.
 * Requires user to be authenticated (ID token in cookie or header).
 */
export async function jumpToUnidy(client: ApiClientInterface, request: JumpToUnidyRequest): Promise<JumpToUnidyResult> {
  const validatedRequest = JumpToUnidyRequestSchema.parse(request);
  const response = await client.post<unknown>("/api/sdk/v1/jump_to/unidy", validatedRequest);

  return handleResponse(response, () => {
    if (!response.success) {
      const errorParse = JumpToUnidyErrorSchema.safeParse(response.data);
      if (errorParse.success) {
        const errorIdentifier = errorParse.data.error_identifier;
        return [errorIdentifier as "user_not_found" | "invalid_path", { error_identifier: errorIdentifier }];
      }

      return ["user_not_found", { error_identifier: "unknown_error" }];
    }

    const parsed = JumpToUnidyResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return ["schema_validation_error", { error_identifier: "schema_validation_error", errors: [] }];
    }

    return [null, parsed.data.token];
  });
}