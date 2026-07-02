import { Component, Host, h, Prop, State } from "@stencil/core";
import { UnidyComponent } from "../../base/component";
import { findParentPaginatedList } from "../../context-utils";
import type { PaginationStore } from "../../store/pagination-store";

@Component({ tag: "u-pagination-page", shadow: false })
export class PaginationPage extends UnidyComponent() {
  /** CSS classes to apply to the span element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() private renderTrigger = 0;

  private store: PaginationStore | null = null;
  private unsubscribers: Array<() => void> = [];

  connectedCallback() {
    this.store = findParentPaginatedList(this.element)?.store ?? null;
    if (!this.store) {
      this.logger.warn("Paginated list component not found (expected u-ticketable-list or u-transaction-list)");
      return;
    }
    // Force a render whenever paginationMeta changes so render() reads fresh state.
    this.unsubscribers.push(
      this.store.onChange("paginationMeta", () => {
        this.renderTrigger++;
      }),
    );
  }

  disconnectedCallback() {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
  }

  render() {
    // Establish renderTrigger dependency so Stencil re-renders on increment.
    void this.renderTrigger;

    if (!this.store) {
      this.logger.warn("Paginated list component not found (expected u-ticketable-list or u-transaction-list)");
      return null;
    }

    const meta = this.store.state.paginationMeta;
    if (!meta) {
      return null;
    }

    return (
      <Host>
        <span class={this.componentClassName}>
          Page {meta.page} of {meta.last}
        </span>
      </Host>
    );
  }
}
