import * as z from "zod";

export const SchemaValidationErrorSchema = z.object({
  error_identifier: z.string(), // unprocessable entity etc. TODO we can define enum later
  errors: z.array(z.string()),
});

export type SchemaValidationError = z.infer<typeof SchemaValidationErrorSchema>;
