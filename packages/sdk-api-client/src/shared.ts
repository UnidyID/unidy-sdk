import * as z from "zod";

export const SchemaValidationErrorSchema = z.object({
  error_identifier: z.string(), // unprocessable entity etc. TODO we can define enum later
  errors: z.array(z.string()),
});

export type SchemaValidationError = z.infer<typeof SchemaValidationErrorSchema>;

export const PaginationMetaSchema = z.object({
  count: z.number(),
  page: z.number(),
  limit: z.number(),
  last: z.number(),
  prev: z.number().nullable(),
  next: z.number().nullable(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Builds a query string from validated Zod schema output
 * @param params - Validated params object from a Zod schema
 * @returns Query string with ? prefix, or empty string if no params
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  // Build query string from validated params
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    searchParams.append(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}
