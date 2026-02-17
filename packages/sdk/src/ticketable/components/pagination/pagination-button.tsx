import { Component, Host, h, Prop, State } from "@stencil/core";
import type { PaginationMeta } from "../../../api";
import { UnidyComponent } from "../../../shared/base/component";
import { findParentTicketableList } from "../../../shared/context-utils";
import type { PaginationStore } from "../../store/pagination-store";

@Component({ tag: "u-pagination-button", shadow: false })
export class PaginationButton extends UnidyComponent() {
  /** The direction of navigation. */
  @Prop() direction: "prev" | "next" = "next";
  /** CSS classes to apply to the button element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() paginationMeta: PaginationMeta | null = null;

  private store: PaginationStore | null = null;
  private unsubscribe: (() => void) | null = null;

  componentWillLoad() {
    this.store = findParentTicketableList(this.element)?.store ?? null;
    if (!this.store) {
      this.logger.warn("TicketableList component not found");
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
    const parent = findParentTicketableList(this.element);
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
      this.logger.warn("TicketableList component not found");
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
