import { Component, Element, Event, type EventEmitter, Host, h, Prop, State } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { UnidyComponent } from "../../../logger";
import type { ExportFormat } from "../../api/schemas";

@Component({ tag: "u-ticketable-export", shadow: false })
export class TicketableExport extends UnidyComponent {
  @Element() el: HTMLElement;

  @Prop() format!: ExportFormat;
  @Prop() customClass?: string;
  @Prop({ reflect: true }) exportable = true;

  @State() loading = false;

  @Event() uTicketableExportSuccess!: EventEmitter<{ url: string; format: ExportFormat }>;
  @Event() uTicketableExportError!: EventEmitter<{ error: string }>;

  private getTicketableInfo(): { id: string; type: "ticket" | "subscription" } | null {
    const id = this.el.getAttribute("data-ticketable-id");
    const type = this.el.getAttribute("data-ticketable-type") as "ticket" | "subscription" | null;

    if (!id || !type) {
      this.logger.warn("Missing ticketable-id or ticketable-type attributes");
      return null;
    }

    return { id, type };
  }

  private handleClick = async () => {
    if (this.loading || !this.exportable) return;

    const info = this.getTicketableInfo();
    if (!info) {
      this.uTicketableExportError.emit({ error: "missing_context" });
      return;
    }

    this.loading = true;

    try {
      const client = await getUnidyClient();
      const service = info.type === "ticket" ? client.tickets : client.subscriptions;
      const [error, data] = await service.getExportLink({ id: info.id, format: this.format });

      if (error !== null) {
        this.uTicketableExportError.emit({ error });
        this.loading = false;
        return;
      }

      if (!data || !("url" in data)) {
        this.uTicketableExportError.emit({ error: "invalid_response" });
        this.loading = false;
        return;
      }

      window.open(data.url, "_blank");
      this.uTicketableExportSuccess.emit({ url: data.url, format: this.format });
    } catch (err) {
      this.logger.error("Export link error", err);
      this.uTicketableExportError.emit({ error: "internal_error" });
    } finally {
      this.loading = false;
    }
  };

  render() {
    const disabled = this.loading || !this.exportable;

    return (
      <Host>
        <button type="button" onClick={this.handleClick} disabled={disabled} class={this.customClass}>
          <slot />
        </button>
      </Host>
    );
  }
}
