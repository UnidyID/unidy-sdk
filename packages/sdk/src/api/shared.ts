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

export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(0).max(250),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
