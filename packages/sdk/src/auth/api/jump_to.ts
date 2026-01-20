import * as z from "zod";

import type { ApiClient } from "../../api";
import { type CommonErrors, ErrorSchema, type ErrorResponse, handleResponse } from "./shared";

// Payload schemas
const JumpToServicePayloadSchema = z.object({
  redirect_uri: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  skip_oauth_authorization: z.boolean().optional(),
});

const JumpToUnidyPayloadSchema = z.object({
  path: z.string(),
});

// Response schema
const JumpToResponseSchema = z.object({
  token: z.string(),
});

// Error response schema with error_identifier
const JumpToErrorSchema = z.object({
  error_identifier: z.string(),
});

// Exported types
export type JumpToServicePayload = z.infer<typeof JumpToServicePayloadSchema>;
export type JumpToUnidyPayload = z.infer<typeof JumpToUnidyPayloadSchema>;
export type JumpToResponse = z.infer<typeof JumpToResponseSchema>;
export type JumpToError = z.infer<typeof JumpToErrorSchema>;

// Result types
export type JumpToServiceResult =
  | CommonErrors
  | ["application_not_found", JumpToError]
  | ["invalid_redirect_uri", JumpToError]
  | ["invalid_scope", JumpToError]
  | ["missing_id_token", ErrorResponse]
  | ["invalid_id_token", ErrorResponse]
  | [null, JumpToResponse];

export type JumpToUnidyResult =
  | CommonErrors
  | ["invalid_path", JumpToError]
  | ["missing_id_token", ErrorResponse]
  | ["invalid_id_token", ErrorResponse]
  | [null, JumpToResponse];

// Jump-to API functions

/**
 * Create a one-time login token for jumping to an external OAuth service.
 * Requires user to be authenticated (ID token in cookie or header).
 */
export async function jumpToService(
  client: ApiClient,
  serviceId: string,
  payload?: JumpToServicePayload,
): Promise<JumpToServiceResult> {
  const response = await client.post<JumpToResponse>(`/api/sdk/v1/jump_to/service/${serviceId}`, payload ?? {});

  return handleResponse(response, () => {
    if (!response.success) {
      // Try parsing as error_identifier format first
      const jumpToErrorCheck = JumpToErrorSchema.safeParse(response.data);
      if (jumpToErrorCheck.success) {
        return [
          jumpToErrorCheck.data.error_identifier as "application_not_found" | "invalid_redirect_uri" | "invalid_scope",
          jumpToErrorCheck.data,
        ];
      }

      // Fall back to standard error format
      const error_response = ErrorSchema.parse(response.data);
      return [error_response.error as "missing_id_token" | "invalid_id_token", error_response];
    }

    return [null, JumpToResponseSchema.parse(response.data)];
  });
}

/**
 * Create a one-time login token for jumping to an internal Unidy path.
 * Requires user to be authenticated (ID token in cookie or header).
 */
export async function jumpToUnidy(client: ApiClient, payload: JumpToUnidyPayload): Promise<JumpToUnidyResult> {
  const response = await client.post<JumpToResponse>("/api/sdk/v1/jump_to/unidy", payload);

  return handleResponse(response, () => {
    if (!response.success) {
      // Try parsing as error_identifier format first
      const jumpToErrorCheck = JumpToErrorSchema.safeParse(response.data);
      if (jumpToErrorCheck.success) {
        return [jumpToErrorCheck.data.error_identifier as "invalid_path", jumpToErrorCheck.data];
      }

      // Fall back to standard error format
      const error_response = ErrorSchema.parse(response.data);
      return [error_response.error as "missing_id_token" | "invalid_id_token", error_response];
    }

    return [null, JumpToResponseSchema.parse(response.data)];
  });
}
