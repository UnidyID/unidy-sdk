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

  // Workaround: @stencil/store auto-subscription doesn't work for slotted shadow:false components
  // (the Proxy never captures the rendering context). @State() mutations always trigger re-renders,
  // so we use onChange + renderTrigger instead. Do not simplify to a plain store.state read.
  @State() private renderTrigger = 0;

  private store: PaginationStore | null = null;
  private unsubscribers: Array<() => void> = [];

  componentWillLoad() {
    // Initial store lookup: runs after the parent's componentWillLoad has set its store.
    this.store = findParentPaginatedList(this.element)?.store ?? null;
    if (!this.store) {
      this.logger.warn("Paginated list component not found (expected u-ticketable-list or u-transaction-list)");
      return;
    }
    this.subscribe();
  }

  connectedCallback() {
    // Re-subscribe after a disconnect/reconnect cycle (slotted components can be temporarily
    // disconnected when a shadow:false parent re-renders). componentWillLoad only runs once.
    if (this.store && this.unsubscribers.length === 0) {
      this.subscribe();
    }
  }

  disconnectedCallback() {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
  }

  private subscribe() {
    this.unsubscribers.push(
      this.store?.onChange("paginationMeta", () => {
        this.renderTrigger++;
      }),
    );
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
