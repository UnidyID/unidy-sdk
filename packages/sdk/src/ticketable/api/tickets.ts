import * as z from "zod";
import { TicketableListParamsBaseSchema } from "./schemas";
import { PaginationMetaSchema } from "../../api/shared";
import { type ApiClient, type ApiResponse, BaseService } from "../../api";

// Date transformer for ISO8601 strings
const dateTransformer = z.coerce.date();
const nullableDateTransformer = z.coerce.date().nullable();

// Ticket types based on TicketSerializer
const TicketSchema = z.object({
  id: z.uuid(), // unidy_id
  title: z.string(),
  text: z.string().nullable(),
  reference: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  wallet_export: z.record(z.string(), z.unknown()).nullable(),
  state: z.string(),
  payment_state: z.string().nullable(),
  button_cta_url: z.string().nullable(),
  info_banner: z.string().nullable(),
  seating: z.string().nullable(),
  venue: z.string().nullable(),
  currency: z.string().nullable(),
  starts_at: dateTransformer, // ISO8601(3) -> Date
  ends_at: nullableDateTransformer, // ISO8601(3) -> Date | null
  created_at: dateTransformer, // ISO8601(3) -> Date
  updated_at: dateTransformer, // ISO8601(3) -> Date
  price: z.number(), // decimal(8, 2) -> float
  user_id: z.uuid(),
  ticket_category_id: z.uuid(),
});

export type Ticket = z.infer<typeof TicketSchema>;

// List response
const TicketsListResponseSchema = z.object({
  meta: PaginationMetaSchema,
  results: z.array(TicketSchema),
});

export type TicketsListResponse = z.infer<typeof TicketsListResponseSchema>;

// Query params schema with validations
const TicketsListParamsSchema = TicketableListParamsBaseSchema.extend({ ticket_category_id: z.string().uuid() }).partial();

export type TicketsListParams = z.input<typeof TicketsListParamsSchema>;

export class TicketsService extends BaseService {
  private listFn: (args: object, params?: TicketsListParams) => Promise<ApiResponse<TicketsListResponse>>;
  private getFn: (args: { id: string }) => Promise<ApiResponse<Ticket>>;

  constructor(client: ApiClient) {
    super(client, "TicketsService");
    this.listFn = this.client.getWithSchema(
      TicketsListResponseSchema,
      () => "/api/sdk/v1/tickets",
      TicketsListParamsSchema,
    );
    this.getFn = this.client.getWithSchema(
      TicketSchema,
      (args: { id: string }) => `/api/sdk/v1/tickets/${args.id}`,
    );
  }

  async list(params?: TicketsListParams): Promise<ApiResponse<TicketsListResponse>> {
    return this.listFn({}, params);
  }

  async get(id: string): Promise<ApiResponse<Ticket>> {
    return this.getFn({ id });
  }
}
