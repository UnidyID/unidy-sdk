import { Component, h, State, Element, Host, Prop, Watch } from '@stencil/core';
import { ApiClient } from '@unidy.io/sdk-api-client';
import type { PaginationMeta } from '@unidy.io/sdk-api-client';
import { format } from 'date-fns/format';
import { enUS } from 'date-fns/locale/en-US';
import { de } from 'date-fns/locale/de';
import { fr } from 'date-fns/locale/fr';
import { nlBE } from 'date-fns/locale/nl-BE';
import { ro } from 'date-fns/locale/ro';

import { TicketsService } from '../../api/tickets';
import { SubscriptionsService } from '../../api/subscriptions';
import { createSkeletonLoader, replaceTextNodesWithSkeletons } from './skeleton-helpers';
import { createPaginationStore, type PaginationStore } from '../../store/pagination-store';

const DEFAULT_SKELETON_COUNT = 2;
const LOCALES = {
  'en-US': enUS,
  'de': de,
  'fr': fr,
  'nl-BE': nlBE,
  'ro': ro,
};

@Component({ tag: 'u-ticketable-list', shadow: false })
export class TicketableList {
  @Element() element: HTMLElement;

  // TODO: move into a generic store, since we'll have this kind of fetching all over the app (also implement SWR and other things inside of it)
  @State() items: any[] = [];
  @State() loading = true;
  @State() error: string | null = null;
  @Prop() paginationMeta: PaginationMeta | null = null;

  // TODO: pull from config
  @Prop() baseUrl?: string = 'http://localhost:3000';
  // TODO: pull from config
  @Prop() apiKey?: string = 'public-newsletter-api-key';
  // TODO: pull from config
  @Prop() locale?: string = 'en-US';

  @Prop() target?: string;
  @Prop() containerClass?: string;

  // TODO: add a component that can override this
  @Prop({ mutable: true }) filter = '';

  // TODO: Add pagination component to override all of this
  @Prop({ mutable: true }) limit = 10;
  @Prop({ mutable: true }) page = 1;

  @Prop() skeletonCount?: number;
  @Prop() skeletonAllText?: boolean = false;
  @Prop() ticketableType!: 'ticket' | 'subscription';

  @Watch('page')
  @Watch('limit')
  @Watch('filter')
  async fetchData() {
    await this.loadData();
  }

  @Prop() store: PaginationStore | null = null;

  async componentWillLoad() {
    this.store = createPaginationStore();
  }

  // TODO[LOGGING]: Log this to console (use shared logger)
  async componentDidLoad() {
    await this.loadData();
  }

  private async loadData() {
    this.loading = true;

    if (!this.baseUrl || !this.apiKey) {
      this.error = '[u-ticketable-list] baseUrl and apiKey are required';
      this.loading = false;
      return;
    }

    if (!this.ticketableType) {
      this.error = '[u-ticketable-list] ticketable-type attribute is required';
      this.loading = false;
      return;
    }

    if (this.ticketableType !== 'ticket' && this.ticketableType !== 'subscription') {
      this.error = `[u-ticketable-list] Invalid ticketable-type: ${this.ticketableType}. Must be 'ticket' or 'subscription'`;
      this.loading = false;
      return;
    }

    try {
      const apiClient = new ApiClient(this.baseUrl, this.apiKey);
      const service = this.ticketableType === 'ticket' ? new TicketsService(apiClient) : new SubscriptionsService(apiClient);

      const response = await service.list({}, {
        page: this.page,
        limit: this.limit,
        ...Object.fromEntries((this.filter || '').split(';').map(pair => pair.split('='))),
      });

      if (!response.success || !response.data) {
        this.error = response.error instanceof Error ? response.error.message : response.error || `[u-ticketable-list] Failed to fetch ${this.ticketableType}s`;
        this.loading = false;
        return;
      }

      this.items = response.data.results;
      this.paginationMeta = response.data.meta;
      
      // Update the store with pagination data
      if (this.store) {
        this.store.state.paginationMeta = response.data.meta;
      }
      
      this.loading = false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : '[u-ticketable-list] An error occurred';
      this.loading = false;
    }
  }

  private renderFragment(template: HTMLTemplateElement, item?: any): DocumentFragment {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const isSkeleton = !item;

    fragment.querySelectorAll('[unidy-attr]').forEach(elem => {
      Array.from(elem.attributes)
        .filter(attr => attr.name.startsWith('unidy-attr-'))
        .map(attr => {
          if (isSkeleton) {
            return [attr, '#'] as const;
          }

          let value = attr.value;
          Object.entries(item).forEach(([key, val]) => {
            value = value.replaceAll(`{{${key}}}`, val as string);
          });

          return [attr, value] as const;
        })
        .forEach(([attr, newValue]) => {
          elem.setAttribute(attr.name.replace('unidy-attr-', ''), newValue);
          elem.removeAttribute(attr.name);
        });
    });

    if (isSkeleton && this.skeletonAllText) {
      replaceTextNodesWithSkeletons(fragment);
    }

    fragment.querySelectorAll('ticketable-value').forEach(valueEl => {
      if (isSkeleton) {
        valueEl.innerHTML = createSkeletonLoader('Sample Text');
      } else {
        const key = valueEl.getAttribute('name');
        if (!key) return;
        const value = (item as any)[key];
        const formatAttr = valueEl.getAttribute('format');
        const dateFormatAttr = valueEl.getAttribute('date-format');

        let finalValue: string;

        if (typeof value === 'object' && value instanceof Date) {
          finalValue = format(value, dateFormatAttr || 'yyyy-MM-dd', { locale: LOCALES[this.locale] || de });
        } else if (typeof value === 'number' && key === 'price') {
          finalValue = new Intl.NumberFormat(this.locale, { style: 'currency', currency: item.currency || 'EUR' }).format(value);
        } else if (typeof value === 'number') {
          finalValue = value.toFixed(2);
        } else if (value != null) {
          finalValue = String(value);
        } else {
          finalValue = valueEl.getAttribute('default') || '';
        }

        if (formatAttr) {
          finalValue = formatAttr.replaceAll('{{value}}', finalValue);
        }

        valueEl.textContent = finalValue;
      }
    });

    return fragment;
  }

  componentDidUpdate() {
    if (this.target) {
      requestAnimationFrame(() => this.renderToTarget());
    }
  }

  componentDidRender() {
    if (this.target) {
      requestAnimationFrame(() => this.renderToTarget());
    }
  }

  private renderToTarget() {
    const template = this.element.querySelector('template');
    if (!template) return;

    const targetElement = document.querySelector(this.target);
    if (!targetElement) {
      // TODO[LOGGING]: Log this to console (use shared logger)
      return;
    }

    // Clear existing content
    targetElement.innerHTML = '';
    this.renderContent(targetElement, template);
  }

  private renderContent(target: Element, template: HTMLTemplateElement) {
    if (this.loading) {
      // Use skeletonCount if provided, otherwise use limit
      const skeletonCount = this.skeletonCount || this.limit;
      Array.from({ length: skeletonCount }).forEach(() => target.appendChild(this.renderFragment(template)));
    } else if (!this.error) {
      this.items.forEach(item => target.appendChild(this.renderFragment(template, item)));
    } else {
      // TODO[LOGGING]: Log this to console (use shared logger)
      target.innerHTML = '<h1>Error: {this.error}</h1>';
    }
  }

  render() {
    if (this.error) {
      // TODO[LOGGING]: Log this to console (use shared logger)
      return <h1>Error: {this.error}</h1>;
    }

    const template = this.element.querySelector('template');
    if (!template) {
      // TODO[LOGGING]: Log this to console (use shared logger)
      return <h1>No template found - fix config</h1>;
    }

    if (this.target) {
      return <Host><slot/></Host>;
    }

    const element = document.createElement('div');
    this.renderContent(element, template);

    return (
      <Host>
        <div class={this.containerClass} innerHTML={element.innerHTML}></div>
        <slot name="pagination"></slot>
      </Host>
    );
  }
}
