import { Component, Event, type EventEmitter, Host, h, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import type { TicketTransfer } from "../../api/schemas";
import { translateTransferError } from "../../transfer-error";

/**
 * Form to send a ticket transfer offer to an email address.
 *
 * Used standalone with an explicit `ticket-id`, or inside a
 * `u-ticketable-list` ticket template where the list stamps the
 * `ticket-id` attribute automatically.
 */
@Component({ tag: "u-ticket-transfer-form", styleUrl: "ticket-transfer-form.css", shadow: false })
export class TicketTransferForm extends UnidyComponent() {
  /** The id of the ticket to transfer. Stamped automatically inside a u-ticketable-list template. */
  @Prop({ attribute: "ticket-id", mutable: true }) ticketId?: string;
  /** Disables the form controls. Stamped automatically on skeleton items inside a u-ticketable-list template. */
  @Prop({ reflect: true }) disabled = false;
  /** CSS classes to apply to the form element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;
  /** CSS classes to apply to the email input element. */
  @Prop() inputClassName?: string;
  /** CSS classes to apply to the submit button element. */
  @Prop() buttonClassName?: string;
  /** CSS classes to apply to the error message element. */
  @Prop() errorClassName?: string;
  /** CSS classes to apply to the success message element. */
  @Prop() successClassName?: string;

  @State() email = "";
  @State() loading = false;
  @State() error: string | null = null;
  @State() success: string | null = null;

  /** Fired when a transfer offer was sent successfully. Contains the created transfer. */
  @Event() uTicketTransferCreateSuccess!: EventEmitter<{ transfer: TicketTransfer }>;
  /** Fired when sending a transfer offer fails. Contains the error code. */
  @Event() uTicketTransferCreateError!: EventEmitter<{ error: string }>;

  private handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (this.loading || this.disabled) return;

    const ticketId = this.ticketId;
    if (!ticketId) {
      this.logger.warn("Missing ticket-id attribute");
      this.error = translateTransferError("missing_ticket");
      this.success = null;
      this.uTicketTransferCreateError.emit({ error: "missing_ticket" });
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const client = await getUnidyClient();
      const [error, transfer] = await client.ticketTransfers.create({ ticketId, recipientEmail: this.email.trim() });

      if (error !== null || !transfer || !("token" in transfer)) {
        this.error = translateTransferError(error ?? "invalid_response");
        this.uTicketTransferCreateError.emit({ error: error ?? "invalid_response" });
        return;
      }

      this.success = t("ticketTransfer.form.success", { email: transfer.recipient_email });
      this.email = "";
      this.uTicketTransferCreateSuccess.emit({ transfer });
    } catch (err) {
      this.logger.error("Ticket transfer create error", err);
      this.error = translateTransferError("internal_error");
      this.uTicketTransferCreateError.emit({ error: "internal_error" });
    } finally {
      this.loading = false;
    }
  };

  render() {
    return (
      <Host>
        <form onSubmit={this.handleSubmit} class={this.componentClassName}>
          <input
            type="email"
            required
            value={this.email}
            onInput={(event: InputEvent) => {
              this.email = (event.target as HTMLInputElement).value;
            }}
            placeholder={t("ticketTransfer.form.email_placeholder")}
            aria-label={t("ticketTransfer.form.email_label")}
            disabled={this.loading || this.disabled}
            class={this.inputClassName}
          />
          <button type="submit" disabled={this.loading || this.disabled} class={this.buttonClassName}>
            <slot>{t("ticketTransfer.form.submit")}</slot>
          </button>
        </form>
        {this.error && (
          <p role="alert" class={this.errorClassName}>
            {this.error}
          </p>
        )}
        {this.success && (
          <p role="status" class={this.successClassName}>
            {this.success}
          </p>
        )}
      </Host>
    );
  }
}
