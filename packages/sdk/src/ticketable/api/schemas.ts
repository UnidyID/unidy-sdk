import { PaginationParamsSchema } from "../../api/shared";
import * as z from "zod";

export const TicketableListParamsBaseSchema = z
  .object({
    service_id: z.number().nullable(),
    state: z.string(),
    payment_state: z.string(),
    order_by: z.enum(["starts_at", "ends_at", "reference", "created_at"]),
    order_direction: z.enum(["asc", "desc"]),
  })
  .merge(PaginationParamsSchema);
