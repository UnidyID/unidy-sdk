import * as z from "zod";

/**
 * Base error schema that all API errors extend from.
 * Contains the common error_identifier field.
 */
export const BaseErrorSchema = z.object({
  error_identifier: z.string(),
});

export type BaseError = z.infer<typeof BaseErrorSchema>;

/**
 * Schema validation error extends base error with an array of error messages.
 */
export const SchemaValidationErrorSchema = BaseErrorSchema.extend({
  errors: z.array(z.string()),
});

export type SchemaValidationError = z.infer<typeof SchemaValidationErrorSchema>;

export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1),
  perPage: z.number().int().min(1).max(500),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/** Pagination of a V2 collection (`meta.pagination`, page strategy). */
export const PaginationSchema = z.object({
  strategy: z.literal("page"),
  sort: z.string(),
  page: z.number(),
  per_page: z.number(),
  count: z.number(),
  pages: z.number(),
  next: z.number().nullable(),
  previous: z.number().nullable(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/** A page of V2 records. */
export type Page<T> = { records: T[]; pagination: Pagination };

/** Identifiers of the V2 error envelope; the HTTP status follows from the identifier. */
export const ApiErrorIdentifierSchema = z.enum([
  "bad_request",
  "invalid_query",
  "unauthorized",
  "forbidden",
  "feature_not_enabled",
  "real_email_required",
  "not_found",
  "conflict",
  "unprocessable_content",
  "multiple_matches",
  "field_not_findable",
  "internal_error",
  "rate_limited",
]);

export type ApiErrorIdentifier = z.infer<typeof ApiErrorIdentifierSchema>;

/** One reason of a V2 error. `field` is a body path (`payload.data.first_name`) or a query parameter. */
export const ApiErrorDetailSchema = z.object({
  field: z.string().nullish(),
  code: z.string(),
  message: z.string().nullish(),
  index: z.number().nullish(),
  unknown: z.string().nullish(),
  allowed: z.array(z.string()).nullish(),
});

export type ApiErrorDetail = z.infer<typeof ApiErrorDetailSchema>;

/** The V2 error envelope. */
export const ApiErrorSchema = z.object({
  identifier: ApiErrorIdentifierSchema,
  details: z.array(ApiErrorDetailSchema),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
