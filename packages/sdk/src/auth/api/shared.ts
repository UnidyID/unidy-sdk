import * as z from "zod";

import type { ApiResponse } from "../../api/base-client";
import type { CommonErrors } from "../../api/base-service";
import { SchemaValidationErrorSchema } from "../../api/shared";
import { unidyState } from "../../shared/store/unidy-store";

// Re-export for submodules
export type { CommonErrors } from "../../api/base-service";

// Error schema for registration endpoints (uses `error` field)
export const ErrorSchema = z.object({
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorSchema>;

/**
 * Central error handling and response parsing for auth API calls.
 * Handles connection errors and schema validation.
 */
export function handleResponse<T>(
  response: ApiResponse<unknown>,
  handler: () => T,
): T | CommonErrors {
  if (response.connectionError) {
    unidyState.backendConnected = false;
    return ["connection_failed", null];
  }

  try {
    return handler();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const parsed = SchemaValidationErrorSchema.safeParse(response.data);
      const schemaError = parsed.success
        ? parsed.data
        : { error_identifier: "schema_validation_error", errors: [String(error)] };
      return ["schema_validation_error", schemaError];
    }
    return ["internal_error", null];
  }
}

/**
 * Builds an endpoint path with optional rid query parameter.
 * Uses URL API to safely handle existing query parameters.
 */
export function withRid(baseUrl: string, path: string, rid?: string): string {
  const url = new URL(path, baseUrl);
  if (rid) {
    url.searchParams.set("rid", rid);
  }
  return url.pathname + url.search;
}