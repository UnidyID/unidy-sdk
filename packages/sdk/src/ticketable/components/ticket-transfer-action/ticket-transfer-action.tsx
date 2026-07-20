import { Component, Event, type EventEmitter, Host, h, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import type { TicketTransfer } from "../../api/schemas";

export type TicketTransferActionType = "accept" | "decline" | "cancel";

const ACTIONS: TicketTransferActionType[] = ["accept", "decline", "cancel"];

/**
 * Button performing an action on a pending ticket transfer.
 *
 * Used standalone with an explicit `token`, or inside a
 * `u-ticket-transfer-list` template where the list stamps the `token`
 * attribute automatically and refetches when the action succeeds.
 */
@Component({ tag: "u-ticket-transfer-action", styleUrl: "ticket-transfer-action.css", shadow: false })
export class TicketTransferAction extends UnidyComponent() {
  /** The action this button performs: "accept" or "decline" an incoming offer, "cancel" an outgoing one. */
  @Prop() action!: TicketTransferActionType;
  /** The transfer token. Stamped automatically inside a u-ticket-transfer-list template. */
  @Prop({ mutable: true }) token?: string;
  /** CSS classes to apply to the button element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() loading = false;

  /** Fired when the action completes successfully. Contains the action and the updated transfer. */
  @Event() uTicketTransferActionSuccess!: EventEmitter<{ action: TicketTransferActionType; transfer: TicketTransfer }>;
  /** Fired when the action fails. Contains the action and the error code. */
  @Event() uTicketTransferActionError!: EventEmitter<{ action: TicketTransferActionType; error: string }>;

  private handleClick = async () => {
    if (this.loading) return;

    const token = this.token;
    if (!token || !ACTIONS.includes(this.action)) {
      this.logger.warn("Missing token or invalid action attribute");
      this.uTicketTransferActionError.emit({ action: this.action, error: "missing_context" });
      return;
    }

    this.loading = true;

    try {
      const client = await getUnidyClient();
      const [error, transfer] = await client.ticketTransfers[this.action]({ token });

      if (error !== null || !transfer || !("token" in transfer)) {
        this.uTicketTransferActionError.emit({ action: this.action, error: error ?? "invalid_response" });
        return;
      }

      this.uTicketTransferActionSuccess.emit({ action: this.action, transfer });
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
        <button type="button" onClick={this.handleClick} disabled={this.loading} class={this.componentClassName}>
          <slot>{t(`ticketTransfer.actions.${this.action}`)}</slot>
        </button>
      </Host>
    );
  }
}
