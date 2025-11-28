import { Component, h, Prop, Element, Host, State } from "@stencil/core";
import type { PaginationMeta } from "../../../api";
import type { PaginationStore } from "../../store/pagination-store";

@Component({ tag: "u-pagination-button", shadow: false })
export class PaginationButton {
  @Element() element: HTMLElement;

  @Prop() direction: "prev" | "next" = "next";
  @Prop() customClass?: string;

  @State() paginationMeta: PaginationMeta | null = null;

  private store: PaginationStore | null = null;
  private unsubscribe: (() => void) | null = null;

  componentDidLoad() {
    this.store = this.element.closest("u-ticketable-list")?.store;
    if (!this.store) {
      // TODO[LOGGING]: Log this to console (use shared logger)
      return;
    }

    // Get initial state
    this.paginationMeta = this.store.state.paginationMeta;

    // Subscribe to store changes - watch for changes to paginationMeta
    this.unsubscribe = this.store.onChange("paginationMeta", (value: PaginationMeta | null) => {
      this.paginationMeta = value;
    });
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  private handleClick = () => {
    const parent = this.element.closest("u-ticketable-list");
    if (!parent || !this.paginationMeta) {
      return;
    }

    const isPrev = this.direction === "prev";
    let newPage: number | null = null;

    if (isPrev && this.paginationMeta.prev !== null) {
      newPage = this.paginationMeta.prev;
    } else if (!isPrev && this.paginationMeta.next !== null) {
      newPage = this.paginationMeta.next;
    }

    if (newPage !== null) {
      parent.setAttribute("page", String(newPage));
    }
  };

  render() {
    if (!this.store) {
      // TODO[LOGGING]: Log this to console (use shared logger)
      return null;
    }

    const isPrev = this.direction === "prev";
    const icon = isPrev ? "←" : "→";

    // Determine disabled state based on pagination meta
    const disabled = !this.paginationMeta || (isPrev ? this.paginationMeta.prev === null : this.paginationMeta.next === null);

    return (
      <Host>
        <button
          type="button"
          onClick={this.handleClick}
          disabled={disabled}
          aria-label={isPrev ? "Previous page" : "Next page"}
          class={this.customClass}
        >
          <slot name="icon">{icon}</slot>
        </button>
      </Host>
    );
  }
}
