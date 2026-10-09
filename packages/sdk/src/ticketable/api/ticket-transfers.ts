import type { ApiClientInterface, ServiceDependencies } from "../../api/base-service";
import { type MeListQuery, type MeResult, MeService } from "../../api/me-service";
import type { ApiError, Page } from "../../api/shared";

// Re-export types for consumers importing from this module directly.
export type {
  OfferedTicket,
  Ticket,
  TicketTransfer,
  TicketTransferDirection,
  TicketTransferMode,
  TicketTransferStatus,
} from "./schemas";

import { type Ticket, TicketSchema, type TicketTransfer, TicketTransferSchema } from "./schemas";

const TRANSFERS_PATH = "/tickets/transfers";
const LIST_ALL_PER_PAGE = 100;

/**
 * Reasons the ticket transfer services give for refusing an action. V2 sends them as the `message` of an
 * error detail (`recipient_is_owner`, or `<reason>: <validation message>`), inside a 422 or 403 envelope.
 */
export const TICKET_TRANSFER_ERROR_IDENTIFIERS = [
  "not_ticket_owner",
  "offer_email_failed",
  "recipient_invite_failed",
  "recipient_is_owner",
  "recipient_mismatch",
  "recipient_missing",
  "ticket_already_entered",
  "ticket_already_transferred",
  "ticket_not_active",
  "ticket_not_transferred",
  "transfer_already_pending",
  "transfer_expired",
  "transfer_not_pending",
] as const;

export type TicketTransferErrorIdentifier = (typeof TICKET_TRANSFER_ERROR_IDENTIFIERS)[number];

// Argument types
/** An `email` offer is mailed to `recipientEmail`; a `link` offer returns a `claim_url` to share. */
export type TicketTransferCreateArgs =
  | { ticketId: string; mode?: "email"; recipientEmail: string }
  | { ticketId: string; mode: "link"; recipientEmail?: never };
export type TicketTransferIdArgs = { id: string };
export type TicketTransferTokenArgs = { token: string };
export type TicketTransferTicketArgs = { ticketId: string };

/**
 * A `/me` result whose refusals carry the transfer reason as their identifier when the API names one
 * (e.g. `["transfer_expired", envelope]`), so it can be translated; other errors keep the V2 identifier.
 */
export type TicketTransferResult<T> = MeResult<T> | [TicketTransferErrorIdentifier, ApiError];

export type TicketTransfersListResult = TicketTransferResult<Page<TicketTransfer>>;
export type TicketTransfersListAllResult = TicketTransferResult<TicketTransfer[]>;
export type TicketTransferActionResult = TicketTransferResult<TicketTransfer>;
/** Result type for revoke/return — the API returns the updated ticket, not a transfer. */
export type TicketTransferTicketActionResult = TicketTransferResult<Ticket>;

function isTransferErrorIdentifier(value: string): value is TicketTransferErrorIdentifier {
  return (TICKET_TRANSFER_ERROR_IDENTIFIERS as readonly string[]).includes(value);
}

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "identifier" in value && "details" in value;
}

function succeeded<T>(result: TicketTransferResult<T>): result is [null, T] {
  return result[0] === null;
}

/**
 * The SDK identifier for a V2 transfer error: the service reason named by a detail, or `not_found` for an
 * unknown claim token or ticket id (a 422 detail rather than a 404, since they arrive in the body).
 */
function ticketTransferErrorIdentifier(error: ApiError): TicketTransferErrorIdentifier | "not_found" | null {
  for (const detail of error.details) {
    const reason = detail.message?.split(":", 1)[0].trim();
    if (reason && isTransferErrorIdentifier(reason)) return reason;
  }

  return error.details.some((detail) => detail.code === "not_found") ? "not_found" : null;
}

/**
 * The signed-in user's ticket transfer offers on `/api/v2/me/tickets/transfers`, and ending a lend on
 * `/api/v2/me/tickets/{id}/holder`.
 */
export class TicketTransfersService extends MeService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TicketTransfersService", deps);
  }

  /** One page of the user's open offers, both the ones they sent and the ones they can accept. Each says its `direction`. */
  async list(query: MeListQuery = {}): Promise<TicketTransfersListResult> {
    return this.withTransferError(await this.fetchPage(TRANSFERS_PATH, TicketTransferSchema, query));
  }

  /** Every open offer of the user, following the pagination. */
  async listAll(): Promise<TicketTransfersListAllResult> {
    const transfers: TicketTransfer[] = [];
    let page: number | null = 1;

    while (page !== null) {
      const result = await this.list({ page, perPage: LIST_ALL_PER_PAGE });
      if (!succeeded(result)) return result;

      transfers.push(...result[1].records);
      page = result[1].pagination.next;
    }

    return [null, transfers];
  }

  /** An open offer the user sent or can accept. */
  async get(args: TicketTransferIdArgs): Promise<TicketTransferActionResult> {
    return this.withTransferError(await this.fetchRecord(this.transferPath(args.id), TicketTransferSchema));
  }

  /** Offers an owned ticket, by email (the default) or as a claim link. */
  async create(args: TicketTransferCreateArgs): Promise<TicketTransferActionResult> {
    const data =
      args.mode === "link"
        ? { ticket_id: args.ticketId, mode: "link" }
        : { ticket_id: args.ticketId, mode: "email", recipient_email: args.recipientEmail };

    return this.withTransferError(await this.write("POST", TRANSFERS_PATH, TicketTransferSchema, { data }));
  }

  /** Accepts an incoming offer. The user becomes the ticket's holder. */
  async accept(args: TicketTransferIdArgs): Promise<TicketTransferActionResult> {
    return this.withTransferError(await this.write("POST", `${this.transferPath(args.id)}/accept`, TicketTransferSchema));
  }

  /** Declines an incoming offer. */
  async decline(args: TicketTransferIdArgs): Promise<TicketTransferActionResult> {
    return this.withTransferError(await this.write("POST", `${this.transferPath(args.id)}/decline`, TicketTransferSchema));
  }

  /** Cancels an outgoing offer. Someone else's offer is `not_found`. */
  async cancel(args: TicketTransferIdArgs): Promise<TicketTransferActionResult> {
    return this.withTransferError(await this.write("DELETE", this.transferPath(args.id), TicketTransferSchema));
  }

  /** Accepts the offer behind a claim link, which carries only its token. */
  async claim(args: TicketTransferTokenArgs): Promise<TicketTransferActionResult> {
    return this.withTransferError(
      await this.write("POST", `${TRANSFERS_PATH}/claim`, TicketTransferSchema, { data: { token: args.token } }),
    );
  }

  /** Owner takes a lent ticket back from its holder. Returns the updated ticket. */
  async revoke(args: TicketTransferTicketArgs): Promise<TicketTransferTicketActionResult> {
    return this.releaseHolder(args.ticketId);
  }

  /** Holder returns a lent ticket to its owner. Returns the updated ticket. */
  // eslint-disable-next-line no-restricted-syntax
  async return(args: TicketTransferTicketArgs): Promise<TicketTransferTicketActionResult> {
    return this.releaseHolder(args.ticketId);
  }

  // One endpoint ends a lend from either side; the API tells owner and holder apart.
  private async releaseHolder(ticketId: string): Promise<TicketTransferTicketActionResult> {
    return this.withTransferError(await this.write("DELETE", `/tickets/${encodeURIComponent(ticketId)}/holder`, TicketSchema));
  }

  private transferPath(id: string): string {
    return `${TRANSFERS_PATH}/${encodeURIComponent(id)}`;
  }

  private withTransferError<T>(result: MeResult<T>): TicketTransferResult<T> {
    const [identifier, error] = result;
    if (identifier === null || !isApiError(error)) return result;

    const transferIdentifier = ticketTransferErrorIdentifier(error);
    return transferIdentifier ? [transferIdentifier, error] : result;
  }
}
