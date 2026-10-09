import { Component, Event, type EventEmitter, Host, h, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import type { TicketTransfer } from "../../api/schemas";
import type { TicketTransferCreateArgs } from "../../api/ticket-transfers";
import { transferSucceeded, translateTransferError } from "../../transfer-error";

/** How the form offers the ticket: mailed to an address, or as a claim link to share. */
export type TicketTransferFormMode = "email" | "link";

/**
 * Form to offer a ticket to someone else, by email or as a claim link.
 *
 * Used standalone with an explicit `ticket-id`, or inside a
 * `u-ticketable-list` ticket template where the list stamps the
 * `ticket-id` attribute automatically.
 */
@Component({ tag: "u-ticket-transfer-form", styleUrl: "ticket-transfer-form.css", shadow: false })
export class TicketTransferForm extends UnidyComponent() {
  /** The id of the ticket to transfer. Stamped automatically inside a u-ticketable-list template. */
  @Prop({ attribute: "ticket-id", mutable: true }) ticketId?: string;
  /** "email" mails the offer to the address entered; "link" creates a claim link to share, shown after submitting. */
  @Prop() mode: TicketTransferFormMode = "email";
  /** Disables the form controls. Stamped automatically on skeleton items inside a u-ticketable-list template. */
  @Prop({ reflect: true }) disabled = false;
  /** CSS classes to apply to the form element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;
  /** CSS classes to apply to the email input element, and to the claim link field in link mode. */
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
  @State() claimUrl: string | null = null;

  /** Fired when a transfer offer was created successfully. Contains the created transfer; a link offer carries its `claim_url`. */
  @Event() uTicketTransferCreateSuccess!: EventEmitter<{ transfer: TicketTransfer }>;
  /** Fired when creating a transfer offer fails. Contains the error code. */
  @Event() uTicketTransferCreateError!: EventEmitter<{ error: string }>;

  private get linkMode(): boolean {
    return this.mode === "link";
  }

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
    this.claimUrl = null;

    const args: TicketTransferCreateArgs = this.linkMode
      ? { ticketId, mode: "link" }
      : { ticketId, mode: "email", recipientEmail: this.email.trim() };

    try {
      const client = await getUnidyClient();
      const result = await client.ticketTransfers.create(args);

      if (!transferSucceeded(result)) {
        this.error = translateTransferError(result[0]);
        this.uTicketTransferCreateError.emit({ error: result[0] });
        return;
      }

      const transfer = result[1];
      if (this.linkMode) {
        this.success = t("ticketTransfer.form.link_success");
        this.claimUrl = transfer.claim_url;
      } else {
        this.success = t("ticketTransfer.form.success", { email: transfer.recipient_email });
        this.email = "";
      }
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
          {!this.linkMode && (
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
          )}
          <button type="submit" disabled={this.loading || this.disabled} class={this.buttonClassName}>
            <slot>{t(this.linkMode ? "ticketTransfer.form.create_link" : "ticketTransfer.form.submit")}</slot>
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
        {this.claimUrl && (
          <input
            type="url"
            readOnly
            value={this.claimUrl}
            aria-label={t("ticketTransfer.form.link_label")}
            class={this.inputClassName}
            onFocus={(event: FocusEvent) => (event.target as HTMLInputElement).select()}
          />
        )}
      </Host>
    );
  }
}
