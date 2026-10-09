import type * as z from "zod";
import { type MeResult, MeService, sortParam } from "../../api/me-service";
import type { Page } from "../../api/shared";
import { type ExportFormat, type ExportLink, ExportLinkSchema, TicketableListParamsSchema } from "./schemas";

/** Common list arguments for ticketable services */
export interface TicketableListArgs {
  page?: number;
  perPage?: number;
  state?: string | null;
  /** `paid` or `not_paid`. */
  paymentState?: string | null;
  orderBy?: "starts_at" | "ends_at" | "reference" | "created_at";
  orderDirection?: "asc" | "desc";
}

export type TicketableListResult<T> = MeResult<Page<T>>;
export type TicketableGetResult<T> = MeResult<T>;
export type TicketableExportLinkResult = MeResult<ExportLink>;

/** Shared list and export behaviour of `/api/v2/me/tickets` and `/api/v2/me/subscriptions`. */
export abstract class TicketableService extends MeService {
  protected async listTicketables<T>(
    path: string,
    schema: z.ZodType<T>,
    args: TicketableListArgs,
    category: Record<string, string | undefined>,
  ): Promise<TicketableListResult<T>> {
    const validated = TicketableListParamsSchema.safeParse(args);
    if (!validated.success) {
      this.logger.error("Invalid list parameters", validated.error);
      return ["invalid_response", null];
    }

    return this.fetchPage(path, schema, {
      page: args.page,
      perPage: args.perPage,
      sort: sortParam(args.orderBy, args.orderDirection),
      filters: { state: args.state, payment_state: args.paymentState, ...category },
    });
  }

  protected async exportLink(path: string, format: ExportFormat): Promise<TicketableExportLinkResult> {
    return this.write("POST", `${path}/exports`, ExportLinkSchema, { data: { format } });
  }
}
