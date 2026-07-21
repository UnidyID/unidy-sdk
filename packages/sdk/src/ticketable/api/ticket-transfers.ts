import type { ApiResponse } from "../../api/base-client";
import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api/base-service";

// Re-export types for consumers importing from this module directly.
export type { TicketTransfer, TicketTransferStatus, TicketTransfersListResponse } from "./schemas";

import { type TicketTransfer, TicketTransferSchema, type TicketTransfersListResponse, TicketTransfersListResponseSchema } from "./schemas";

/**
 * Error identifiers the ticket transfer endpoints return in response bodies.
 * See docs/API.md ("Ticket Transfers") in the Unidy backend.
 */
const TICKET_TRANSFER_ERROR_IDENTIFIERS = [
  "feature_disabled",
  "not_ticket_owner",
  "not_transfer_sender",
  "offer_email_failed",
  "recipient_invite_failed",
  "recipient_is_owner",
  "recipient_mismatch",
  "ticket_already_transferred",
  "ticket_not_active",
  "transfer_already_pending",
  "transfer_expired",
  "transfer_not_pending",
] as const;

export type TicketTransferErrorIdentifier = (typeof TICKET_TRANSFER_ERROR_IDENTIFIERS)[number];

// Argument types
export type TicketTransferCreateArgs = { ticketId: string; recipientEmail: string };
export type TicketTransferTokenArgs = { token: string };

// Result types
export type TicketTransferError =
  | CommonErrors
  | ["missing_id_token", null]
  | [TicketTransferErrorIdentifier, null]
  | ["not_found", null]
  | ["unauthorized", null]
  | ["server_error", null]
  | ["invalid_response", null];

export type TicketTransfersListResult = TicketTransferError | [null, TicketTransfersListResponse];
export type TicketTransferActionResult = TicketTransferError | [null, TicketTransfer];

export class TicketTransfersService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TicketTransfersService", deps);
  }

  /** Lists the user's pending, unexpired transfers, split into incoming and outgoing. */
  async list(): Promise<TicketTransfersListResult> {
    const idToken = await this.resolveIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const response = await this.client.get<unknown>("/api/sdk/v1/ticket_transfers", this.buildAuthHeaders({ "X-ID-Token": idToken }));

    return this.handleResponse(response, () => {
      if (!response.success) {
        this.logger.error("Failed to fetch ticket transfers", response);
        return this.errorIdentifierResult(response);
      }

      const parsed = TicketTransfersListResponseSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid ticket transfers response", parsed.error);
        this.errorReporter.captureException(parsed.error, { endpoint: "/api/sdk/v1/ticket_transfers" });
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }

  /** Sends a transfer offer for an owned ticket to the given email address. */
  async create(args: TicketTransferCreateArgs): Promise<TicketTransferActionResult> {
    return this.postAction(`/api/sdk/v1/tickets/${args.ticketId}/transfer`, { recipient_email: args.recipientEmail });
  }

  /** Accepts a transfer offer addressed to the authenticated user. The ticket moves to them. */
  async accept(args: TicketTransferTokenArgs): Promise<TicketTransferActionResult> {
    return this.postAction(`/api/sdk/v1/ticket_transfers/${args.token}/accept`, {});
  }

  /** Declines a transfer offer addressed to the authenticated user. */
  async decline(args: TicketTransferTokenArgs): Promise<TicketTransferActionResult> {
    return this.postAction(`/api/sdk/v1/ticket_transfers/${args.token}/decline`, {});
  }

  /** Cancels a pending transfer offer previously sent by the authenticated user. */
  async cancel(args: TicketTransferTokenArgs): Promise<TicketTransferActionResult> {
    return this.postAction(`/api/sdk/v1/ticket_transfers/${args.token}/cancel`, {});
  }

  private async postAction(endpoint: string, body: object): Promise<TicketTransferActionResult> {
    const idToken = await this.resolveIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const response = await this.client.post<unknown>(endpoint, body, this.buildAuthHeaders({ "X-ID-Token": idToken }));

    return this.handleResponse(response, () => {
      if (!response.success) {
        return this.errorIdentifierResult(response);
      }

      const parsed = TicketTransferSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid ticket transfer response", parsed.error);
        this.errorReporter.captureException(parsed.error, { endpoint });
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }

  /**
   * A consumer-injected getIdToken may reject instead of returning null —
   * methods must still resolve to the documented [error, data] tuple.
   */
  private async resolveIdToken(): Promise<string | null> {
    try {
      return await this.getIdToken();
    } catch (err) {
      this.logger.error("Failed to resolve ID token", err);
      return null;
    }
  }

  /**
   * Maps a failed response to a typed error tuple. The backend communicates
   * domain errors via `error_identifier` in the body; status codes are only a
   * fallback for responses without one (e.g. 404 from a wrong token).
   */
  private errorIdentifierResult(
    response: ApiResponse<unknown>,
  ): [TicketTransferErrorIdentifier, null] | ["not_found", null] | ["unauthorized", null] | ["server_error", null] {
    const data = response.data;
    if (data && typeof data === "object" && "error_identifier" in data) {
      const identifier = (data as { error_identifier: unknown }).error_identifier;
      if (typeof identifier === "string" && (TICKET_TRANSFER_ERROR_IDENTIFIERS as readonly string[]).includes(identifier)) {
        return [identifier as TicketTransferErrorIdentifier, null];
      }
    }

    if (response.status === 404) {
      return ["not_found", null];
    }
    if (response.status === 401 || response.status === 403) {
      return ["unauthorized", null];
    }
    return ["server_error", null];
  }
}
