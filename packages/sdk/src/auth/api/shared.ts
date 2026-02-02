import * as Sentry from "@sentry/browser";
import * as z from "zod";

import { type ApiResponse, type SchemaValidationError, SchemaValidationErrorSchema } from "../../api";
import { UserProfileSchema } from "../../profile";
import { unidyState } from "../../shared/store/unidy-store";

// Common schemas
export const ErrorSchema = z.object({
  error: z.string(),
});

export const TokenResponseSchema = z.object({
  jwt: z.string(),
  sid: z.string().optional(),
});

export const RequiredFieldsResponseSchema = z.object({
  error: z.literal("missing_required_fields"),
  fields: UserProfileSchema.omit({ custom_attributes: true })
    .partial()
    .extend({
      custom_attributes: UserProfileSchema.shape.custom_attributes?.optional(),
    }),
});

// Common types
export type ErrorResponse = z.infer<typeof ErrorSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type RequiredFieldsResponse = z.infer<typeof RequiredFieldsResponseSchema>;

export type CommonErrors = ["connection_failed", null] | ["schema_validation_error", SchemaValidationError];

/**
 * Central error handling and response parsing for auth API calls.
 * Handles connection errors and schema validation.
 */
export function handleResponse<T>(
  response: ApiResponse<unknown>,
  handler: () => T,
): T | ["connection_failed", null] | ["schema_validation_error", SchemaValidationError] {
  if (response.connectionError) {
    unidyState.backendConnected = false;
    return ["connection_failed", null];
  }

  try {
    return handler();
  } catch (error) {
    Sentry.captureException(error);
    return ["schema_validation_error", SchemaValidationErrorSchema.parse(response.data)];
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
