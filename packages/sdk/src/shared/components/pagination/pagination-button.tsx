import { Component, Host, h, Prop, State } from "@stencil/core";
import { UnidyComponent } from "../../base/component";
import { findParentPaginatedList } from "../../context-utils";
import type { PaginationStore } from "../../store/pagination-store";

@Component({ tag: "u-pagination-button", shadow: false })
export class PaginationButton extends UnidyComponent() {
  /** The direction of navigation. */
  @Prop() direction: "prev" | "next" = "next";
  /** CSS classes to apply to the button element. */
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

  private handleClick = () => {
    const parent = findParentPaginatedList(this.element);
    if (!parent || !this.store) {
      return;
    }

    const meta = this.store.state.paginationMeta;
    if (!meta) return;

    const isPrev = this.direction === "prev";
    const newPage = isPrev ? meta.prev : meta.next;

    if (newPage !== null) {
      parent.setAttribute("page", String(newPage));
    }
  };

  render() {
    // Establish renderTrigger dependency so Stencil re-renders on increment.
    void this.renderTrigger;

    if (!this.store) {
      this.logger.warn("Paginated list component not found (expected u-ticketable-list or u-transaction-list)");
      return null;
    }

    const isPrev = this.direction === "prev";
    const icon = isPrev ? "←" : "→";

    const meta = this.store.state.paginationMeta;
    const disabled = !meta || (isPrev ? meta.prev === null : meta.next === null);

    return (
      <Host>
        <button
          type="button"
          onClick={this.handleClick}
          disabled={disabled}
          aria-label={isPrev ? "Previous page" : "Next page"}
          class={this.componentClassName}
        >
          <slot name="icon">
            <span aria-hidden="true">{icon}</span>
          </slot>
        </button>
      </Host>
    );
  }
}
