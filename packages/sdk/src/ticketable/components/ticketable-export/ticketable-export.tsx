import { Component, Element, Event, type EventEmitter, Host, Prop, State, h } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { UnidyComponent } from "../../../logger";
import type { ExportFormat } from "../../api/schemas";

@Component({ tag: "u-ticketable-export", shadow: false })
export class TicketableExport extends UnidyComponent {
  @Element() element: HTMLElement;

  @Prop() format!: ExportFormat;
  @Prop() customClass?: string;
  @Prop({ reflect: true }) exportable = true;

  @State() loading = false;

  @Event() uTicketableExportSuccess!: EventEmitter<{ url: string; format: ExportFormat }>;
  @Event() uTicketableExportError!: EventEmitter<{ error: string }>;

  private getTicketableInfo(): { id: string; type: "ticket" | "subscription" } | null {
    const id = this.element.getAttribute("data-ticketable-id");
    const type = this.element.getAttribute("data-ticketable-type") as "ticket" | "subscription" | null;

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
      this.uTicketableExportError.emit({ error: "Missing ticketable context" });
      return;
    }

    this.loading = true;

    try {
      const auth = await Auth.getInstance();
      const token = await auth.getToken();

      if (typeof token !== "string") {
        this.uTicketableExportError.emit({ error: "Not authenticated" });
        this.loading = false;
        return;
      }

      const client = await getUnidyClient();
      const service = info.type === "ticket" ? client.tickets : client.subscriptions;
      const response = await service.getExportLink({ id: info.id, format: this.format }, token);

      if (!response.success || !response.data) {
        const errorMessage = typeof response.error === "string" ? response.error : "Failed to get export link";
        this.uTicketableExportError.emit({ error: errorMessage });
        this.loading = false;
        return;
      }

      window.open(response.data.url, "_blank");
      this.uTicketableExportSuccess.emit({ url: response.data.url, format: this.format });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      this.uTicketableExportError.emit({ error: errorMessage });
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
