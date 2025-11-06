import type { ApiClient, ApiResponse } from "@unidy.io/sdk-api-client";
import { PaginationMetaSchema, type PaginationMeta, buildQueryString } from "@unidy.io/sdk-api-client";
import * as z from "zod";

// Date transformer for ISO8601 strings
const dateTransformer = z.string().datetime().transform((str) => new Date(str));
const nullableDateTransformer = z.string().datetime().nullable().transform((str) => str ? new Date(str) : null);

// Ticket types based on TicketSerializer
const TicketSchema = z.object({
  id: z.string().uuid(), // unidy_id
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
  user_id: z.string().uuid(),
  ticket_category_id: z.string().uuid(),
});

export type Ticket = z.infer<typeof TicketSchema>;

// Re-export PaginationMeta for convenience
export type { PaginationMeta };

// List response
const TicketsListResponseSchema = z.object({
  meta: PaginationMetaSchema,
  results: z.array(TicketSchema),
});

export type TicketsListResponse = z.infer<typeof TicketsListResponseSchema>;

// Get response (just the ticket)
export type TicketGetResponse = Ticket;

// Query params schema with validations
const TicketsListParamsSchema = z.object({
  service_id: z.coerce.number().int().positive(),
  ticket_category_id: z.string().uuid(),
  state: z.string(),
  payment_state: z.string(),
  order_by: z.enum(["starts_at", "ends_at", "reference", "created_at"]),
  order_direction: z.enum(["asc", "desc"]),
  page: z.number().int().min(1),
  limit: z.number().int().min(0).max(250),
}).partial();

export type TicketsListParams = z.input<typeof TicketsListParamsSchema>;

export class TicketsService {
  constructor(private client: ApiClient) {}

  async list(params?: TicketsListParams): Promise<ApiResponse<TicketsListResponse>> {
    // Validate and parse params with Zod
    const validatedParams = params ? TicketsListParamsSchema.parse(params) : undefined;
    const queryString = validatedParams ? buildQueryString(validatedParams) : "";
    const response = await this.client.get<unknown>(`/api/sdk/v1/tickets${queryString}`);

    if (!response.success || !response.data) {
      return response as ApiResponse<TicketsListResponse>;
    }

    const parsed = TicketsListResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      return {
        ...response,
        success: false,
        error: "Invalid response format",
        data: undefined,
      };
    }

    return {
      ...response,
      data: parsed.data,
    };
  }

  async get(id: string): Promise<ApiResponse<TicketGetResponse>> {
    const response = await this.client.get<unknown>(`/api/sdk/v1/tickets/${id}`);

    if (!response.success || !response.data) {
      return response as ApiResponse<TicketGetResponse>;
    }

    const parsed = TicketSchema.safeParse(response.data);
    if (!parsed.success) {
      return {
        ...response,
        success: false,
        error: "Invalid response format",
        data: undefined,
      };
    }

    return {
      ...response,
      data: parsed.data,
    };
  }
}

