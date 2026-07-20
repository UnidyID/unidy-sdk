import { t } from "../i18n";
import { translateListError } from "../shared/list-renderer";

/**
 * Maps a ticket-transfer error code to a translated message. Backend
 * `error_identifier`s (e.g. `transfer_already_pending`) resolve through the
 * `ticketTransfer.errors.*` locale keys; transport-level codes fall back to
 * the shared list-error mapping.
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
