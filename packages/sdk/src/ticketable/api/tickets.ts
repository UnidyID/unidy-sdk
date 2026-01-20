import * as z from "zod";
import type { ApiClient, ApiResponse } from "../../api";
import { PaginationMetaSchema } from "../../api/shared";
import { getWithSchema } from "./get-with-schema";
import { type ExportFormat, type ExportLinkResponse, ExportLinkResponseSchema, TicketableListParamsBaseSchema } from "./schemas";

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
  exportable_to_wallet: z.boolean(),
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

export class TicketsService {
  list: (args: object, params?: TicketsListParams) => Promise<ApiResponse<TicketsListResponse>>;
  get: (args: { id: string }) => Promise<ApiResponse<Ticket>>;

  constructor(private client: ApiClient) {
    this.list = getWithSchema(this.client, TicketsListResponseSchema, (_args: unknown) => "/api/sdk/v1/tickets", TicketsListParamsSchema);

    this.get = getWithSchema(this.client, TicketSchema, (args: { id: string }) => `/api/sdk/v1/tickets/${args.id}`);
  }

  async getExportLink(args: { id: string; format: ExportFormat }, idToken: string): Promise<ApiResponse<ExportLinkResponse>> {
    const response = await this.client.post<unknown>(`/api/sdk/v1/tickets/${args.id}/export_link`, { format: args.format }, { "X-ID-Token": idToken });

    return this.handleResponse(response, () => ExportLinkResponseSchema.parse(response.data));
  }

  private handleResponse<T>(response: ApiResponse<unknown>, parser: () => T): ApiResponse<T> {
    if (!response.success || !response.data) {
      return response as ApiResponse<T>;
    }

    try {
      return { ...response, data: parser() };
    } catch {
      return { ...response, success: false, error: "Invalid response format", data: undefined };
    }
  }
}
