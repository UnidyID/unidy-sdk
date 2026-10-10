import { Component, Event, type EventEmitter, Host, h, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import type { Ticket, TicketTransfer } from "../../api/schemas";
import type { TicketTransferActionResult, TicketTransfersService } from "../../api/ticket-transfers";
import { transferSucceeded } from "../../transfer-error";

export type TicketTransferActionType = "accept" | "decline" | "cancel" | "revoke" | "return";

const TRANSFER_ACTIONS: TicketTransferActionType[] = ["accept", "decline", "cancel"];
const TICKET_ID_ACTIONS: TicketTransferActionType[] = ["revoke", "return"];
const ACTIONS: TicketTransferActionType[] = [...TRANSFER_ACTIONS, ...TICKET_ID_ACTIONS];

export type TicketTransferActionSuccessPayload =
  | { action: "accept" | "decline" | "cancel"; transfer: TicketTransfer; ticket?: never }
  | { action: "revoke" | "return"; ticket: Ticket; transfer?: never };

/**
 * Button performing an action on a ticket transfer offer.
 *
 * Used standalone with an explicit `transfer-id` (or a claim link's `token`),
 * or inside a `u-ticket-transfer-list` template where the list stamps the
 * `transfer-id` attribute automatically and refetches when the action succeeds.
 */
@Component({ tag: "u-ticket-transfer-action", styleUrl: "ticket-transfer-action.css", shadow: false })
export class TicketTransferAction extends UnidyComponent() {
  /** The action this button performs. By transfer: "accept", "decline", "cancel". By ticket: "revoke" (owner takes it back), "return" (holder gives it back). */
  @Prop() action!: TicketTransferActionType;
  /** The transfer id. Required for decline/cancel, and for accept unless a claim `token` is given. Stamped automatically inside a u-ticket-transfer-list template. */
  @Prop({ attribute: "transfer-id", mutable: true }) transferId?: string;
  /** The token of a claim link. With action "accept" and no `transfer-id`, accepting claims the offer behind the link. */
  @Prop({ mutable: true }) token?: string;
  /** The ticket id. Required for revoke/return. Stamped automatically inside a u-ticketable-list template. */
  @Prop({ attribute: "ticket-id", mutable: true }) ticketId?: string;
  /** Disables the button. Stamped automatically on skeleton items inside list templates. */
  @Prop({ reflect: true }) disabled = false;
  /** CSS classes to apply to the button element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() loading = false;

  /** Fired when the action completes successfully. Payload differs by action type. */
  @Event() uTicketTransferActionSuccess!: EventEmitter<TicketTransferActionSuccessPayload>;
  /** Fired when the action fails. Contains the action and the error code (a transfer reason such as `transfer_expired`, or a V2 identifier such as `not_found`). */
  @Event() uTicketTransferActionError!: EventEmitter<{ action: TicketTransferActionType; error: string }>;

  private handleClick = async () => {
    if (this.loading || this.disabled) return;

    if (!ACTIONS.includes(this.action)) {
      this.logger.warn("Invalid action attribute", this.action);
      this.uTicketTransferActionError.emit({ action: this.action, error: "missing_context" });
      return;
    }

    this.loading = true;

    try {
      const client = await getUnidyClient();

      if (TRANSFER_ACTIONS.includes(this.action)) {
        const action = this.action as "accept" | "decline" | "cancel";
        const call = this.transferCall(client.ticketTransfers, action);
        if (!call) {
          this.logger.warn("Missing transfer-id attribute for action", this.action);
          this.uTicketTransferActionError.emit({ action, error: "missing_context" });
          return;
        }

        const result = await call();
        if (!transferSucceeded(result)) {
          this.uTicketTransferActionError.emit({ action, error: result[0] });
          return;
        }
        this.uTicketTransferActionSuccess.emit({ action, transfer: result[1] });
      } else {
        const ticketId = this.ticketId;
        if (!ticketId) {
          this.logger.warn("Missing ticket-id attribute for action", this.action);
          this.uTicketTransferActionError.emit({ action: this.action, error: "missing_context" });
          return;
        }
        const action = this.action as "revoke" | "return";
        const result =
          action === "revoke" ? await client.ticketTransfers.revoke({ ticketId }) : await client.ticketTransfers.return({ ticketId });
        if (!transferSucceeded(result)) {
          this.uTicketTransferActionError.emit({ action, error: result[0] });
          return;
        }
        this.uTicketTransferActionSuccess.emit({ action, ticket: result[1] });
      }
    } catch (err) {
      this.logger.error("Ticket transfer action error", err);
      this.uTicketTransferActionError.emit({ action: this.action, error: "internal_error" });
    } finally {
      this.loading = false;
    }
  };

  // A claim link carries only the token, so accepting without a transfer id claims the offer behind it.
  private transferCall(
    service: TicketTransfersService,
    action: "accept" | "decline" | "cancel",
  ): (() => Promise<TicketTransferActionResult>) | null {
    const id = this.transferId;
    if (id) return () => service[action]({ id });

    const token = this.token;
    if (action === "accept" && token) return () => service.claim({ token });

    return null;
  }

  render() {
    return (
      <Host>
        <button type="button" onClick={this.handleClick} disabled={this.loading || this.disabled} class={this.componentClassName}>
          <slot>{t(`ticketTransfer.actions.${this.action}`)}</slot>
        </button>
      </Host>
    );
  }
}
