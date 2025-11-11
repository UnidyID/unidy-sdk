import { Component, h, Element, Host, State, Prop } from '@stencil/core';
import type { PaginationMeta } from '@unidy.io/sdk-api-client';
import type { PaginationStore } from '../../store/pagination-store';

@Component({ tag: 'u-pagination-page', shadow: false })
export class PaginationPage {
  @Element() element: HTMLElement;

  @Prop() customClass?: string;

  @State() paginationMeta: PaginationMeta | null = null;

  private store: PaginationStore | null = null;
  private unsubscribe: (() => void) | null = null;

  componentDidLoad() {
    this.store = this.element.closest('u-ticketable-list')?.store;
    if (!this.store) {
      // TODO[LOGGING]: Log this to console (use shared logger)
      return;
    }

    // Get initial state
    this.paginationMeta = this.store.state.paginationMeta;

    // Subscribe to store changes - watch for changes to paginationMeta
    this.unsubscribe = this.store.onChange('paginationMeta', (value: PaginationMeta | null) => {
      this.paginationMeta = value;
    });
  }

  disconnectedCallback() {
    this.unsubscribe && this.unsubscribe();
  }

  render() {
    if(!this.store) {
      // TODO[LOGGING]: Log this to console (use shared logger)
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

