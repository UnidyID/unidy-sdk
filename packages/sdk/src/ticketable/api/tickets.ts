import * as z from "zod";
import { TicketableListParamsBaseSchema } from "./schemas";
import { PaginationMetaSchema } from "../../api/shared";
import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api";

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

// Result types using tuples
export type ListTicketsResult = CommonErrors | ["invalid_response", null] | [null, TicketsListResponse];

export type GetTicketResult = CommonErrors | ["not_found", null] | ["invalid_response", null] | [null, Ticket];

export class TicketsService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TicketsService", deps);
  }

  async list(params?: TicketsListParams): Promise<ListTicketsResult> {
    const validatedParams = params ? TicketsListParamsSchema.parse(params) : undefined;
    const queryString = validatedParams ? `?${new URLSearchParams(validatedParams as Record<string, string>).toString()}` : "";

    const response = await this.client.get<unknown>(`/api/sdk/v1/tickets${queryString}`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        throw new Error("Failed to fetch tickets");
      }

      const parsed = TicketsListResponseSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid response format", parsed.error);
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }

  async get(id: string): Promise<GetTicketResult> {
    const response = await this.client.get<unknown>(`/api/sdk/v1/tickets/${id}`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        if (response.status === 404) {
          return ["not_found", null];
        }
        throw new Error("Failed to fetch ticket");
      }

      const parsed = TicketSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid response format", parsed.error);
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }
}
