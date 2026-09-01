import { Component, Event, type EventEmitter, Host, h, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import type { Ticket, TicketTransfer } from "../../api/schemas";

export type TicketTransferActionType = "accept" | "decline" | "cancel" | "revoke" | "return";

const TOKEN_ACTIONS: TicketTransferActionType[] = ["accept", "decline", "cancel"];
const TICKET_ID_ACTIONS: TicketTransferActionType[] = ["revoke", "return"];
const ACTIONS: TicketTransferActionType[] = [...TOKEN_ACTIONS, ...TICKET_ID_ACTIONS];

export type TicketTransferActionSuccessPayload =
  | { action: "accept" | "decline" | "cancel"; transfer: TicketTransfer; ticket?: never }
  | { action: "revoke" | "return"; ticket: Ticket; transfer?: never };

/**
 * Button performing an action on a pending ticket transfer.
 *
 * Used standalone with an explicit `token`, or inside a
 * `u-ticket-transfer-list` template where the list stamps the `token`
 * attribute automatically and refetches when the action succeeds.
 */
@Component({ tag: "u-ticket-transfer-action", styleUrl: "ticket-transfer-action.css", shadow: false })
export class TicketTransferAction extends UnidyComponent() {
  /** The action this button performs. Token-based: "accept", "decline", "cancel". Ticket-id-based: "revoke", "return". */
  @Prop() action!: TicketTransferActionType;
  /** The transfer token. Required for accept/decline/cancel. Stamped automatically inside a u-ticket-transfer-list template. */
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
  /** Fired when the action fails. Contains the action and the error code. */
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

      if (TOKEN_ACTIONS.includes(this.action)) {
        const token = this.token;
        if (!token) {
          this.logger.warn("Missing token attribute for action", this.action);
          this.uTicketTransferActionError.emit({ action: this.action, error: "missing_context" });
          return;
        }
        const action = this.action as "accept" | "decline" | "cancel";
        const [error, transfer] = await client.ticketTransfers[action]({ token });
        if (error !== null || !transfer || !("token" in transfer)) {
          this.uTicketTransferActionError.emit({ action: this.action, error: error ?? "invalid_response" });
          return;
        }
        this.uTicketTransferActionSuccess.emit({ action, transfer });
      } else {
        const ticketId = this.ticketId;
        if (!ticketId) {
          this.logger.warn("Missing ticket-id attribute for action", this.action);
          this.uTicketTransferActionError.emit({ action: this.action, error: "missing_context" });
          return;
        }
        const action = this.action as "revoke" | "return";
        const sdkMethod =
          action === "revoke"
            ? client.ticketTransfers.revoke.bind(client.ticketTransfers)
            : client.ticketTransfers.return.bind(client.ticketTransfers);
        const [error, ticket] = await sdkMethod({ ticketId });
        if (error !== null || !ticket || !("id" in ticket)) {
          this.uTicketTransferActionError.emit({ action: this.action, error: error ?? "invalid_response" });
          return;
        }
        this.uTicketTransferActionSuccess.emit({ action, ticket });
      }
    } catch (err) {
      this.logger.error("Ticket transfer action error", err);
      this.uTicketTransferActionError.emit({ action: this.action, error: "internal_error" });
    } finally {
      this.loading = false;
    }
  };

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
