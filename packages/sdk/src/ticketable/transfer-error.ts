import { t } from "../i18n";
import { translateListError } from "../shared/list-renderer";
import type { TicketTransferResult } from "./api/ticket-transfers";

/**
 * Maps a ticket-transfer error code to a translated message. Transfer
 * reasons (e.g. `transfer_already_pending`) and V2 identifiers (e.g.
 * `not_found`) resolve through the `ticketTransfer.errors.*` locale keys;
 * transport-level codes fall back to the shared list-error mapping.
 */
export function translateTransferError(error: string | null): string {
  if (error) {
    const specific = t(`ticketTransfer.errors.${error}`, { defaultValue: "" });
    if (specific) {
      return specific;
    }
  }

  return translateListError("ticketTransfer.errors.generic", "Something went wrong. Please try again", error);
}

/** Narrows a transfer result to its success branch. */
export function transferSucceeded<T>(result: TicketTransferResult<T>): result is [null, T] {
  return result[0] === null;
}
