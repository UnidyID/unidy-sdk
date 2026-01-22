import { Component, Host, h, Prop, State } from "@stencil/core";
import type { PaginationMeta } from "../../../api";
import { UnidyComponent } from "../../../shared/base/component";
import { findParentTicketableList } from "../../../shared/context-utils";
import type { PaginationStore } from "../../store/pagination-store";

@Component({ tag: "u-pagination-page", shadow: false })
export class PaginationPage extends UnidyComponent() {
  @Prop() customClass?: string;

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

  render() {
    if (!this.store) {
      this.logger.warn("TicketableList component not found");
      return null;
    }

    if (!this.paginationMeta) {
      return null;
    }

    return (
      <Host>
        <span class={this.customClass}>
          Page {this.paginationMeta.page} of {this.paginationMeta.last}
        </span>
      </Host>
    );
  }
}