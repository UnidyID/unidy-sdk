import * as z from "zod";
import { PaginationParamsSchema } from "../../api/shared";

export const ExportFormat = z.enum(["pdf", "pkpass"]);
export type ExportFormat = z.infer<typeof ExportFormat>;

export const ExportLinkResponseSchema = z.object({
  url: z.string().url(),
  expires_in: z.number(),
});
export type ExportLinkResponse = z.infer<typeof ExportLinkResponseSchema>;

export const TicketableListParamsBaseSchema = z
  .object({
    service_id: z.number().nullable(),
    state: z.string(),
    payment_state: z.string(),
    order_by: z.enum(["starts_at", "ends_at", "reference", "created_at"]),
    order_direction: z.enum(["asc", "desc"]),
  })
  .merge(PaginationParamsSchema);
