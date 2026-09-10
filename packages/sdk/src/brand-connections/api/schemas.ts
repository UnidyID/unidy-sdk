import * as z from "zod";
import { BaseErrorSchema } from "../../api/shared";

export const BrandConnectionSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  host: z.string(),
  url: z.string(),
  display_name: z.string(),
  logo_url: z.string().nullable(),
  colors: z.object({
    background: z.string(),
    foreground: z.string(),
    text: z.string(),
  }),
  current: z.boolean(),
  default: z.boolean(),
  connected: z.boolean(),
  connectable: z.boolean(),
  disconnectable: z.boolean(),
});

export const BrandConnectionsListResponseSchema = z.array(BrandConnectionSchema);

export const BrandConnectionErrorResponseSchema = BaseErrorSchema.extend({
  error_details: z.record(z.string(), z.unknown()).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type BrandConnection = z.infer<typeof BrandConnectionSchema>;
export type BrandConnectionErrorResponse = z.infer<typeof BrandConnectionErrorResponseSchema>;
