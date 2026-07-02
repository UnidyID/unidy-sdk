import { Component, Event, type EventEmitter, Host, h, Prop, State, Watch } from "@stencil/core";
import type { PaginationMeta } from "../../../api";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { onChange as authOnChange } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { loadLocales, renderFragment, renderListContent, translateListError } from "../../../shared/list-renderer";
import type { PaginationStore } from "../../../shared/store/pagination-store";
import { waitForConfig } from "../../../shared/store/unidy-store";
import type { Subscription } from "../../api/subscriptions";
import type { Ticket } from "../../api/tickets";

export type TicketableType = "ticket" | "subscription";
export type TicketableItem = Ticket | Subscription;

@Component({ tag: "u-ticketable-list", shadow: false })
export class TicketableList extends UnidyComponent() {
  private unsubscribeAuth?: () => void;

  @State() items: TicketableItem[] = [];
  @State() loading = true;
  @State() error: string | null = null;

  /** Pagination metadata from the API response. */
  @Prop() paginationMeta: PaginationMeta | null = null;

  /** CSS selector for the target element where items will be rendered. */
  @Prop() target?: string;
  /** CSS classes to apply to the container element. */
  @Prop() containerClass?: string;

  /** Filter string for API queries (e.g., 'state=active;payment_state=paid'). */
  @Prop({ mutable: true }) filter = "";

  /** Number of items per page. */
  @Prop({ mutable: true }) limit = 10;
  /** Current page number. */
  @Prop({ mutable: true }) page = 1;

  /** Number of skeleton items to show while loading. Defaults to limit. */
  @Prop() skeletonCount?: number;
  /** If true, replaces all text content with skeleton loaders. */
  @Prop() skeletonAllText?: boolean = false;
  /** The type of ticketable items to list ('ticket' or 'subscription'). */
  @Prop() ticketableType!: TicketableType;

  /** Pagination store instance for external state management. */
  @Prop() store: PaginationStore | null = null;

  /** Fired when items are successfully fetched. Contains items and pagination metadata. */
  @Event() uTicketableListSuccess!: EventEmitter<{
    ticketableType: TicketableType;
    items: TicketableItem[];
    paginationMeta: PaginationMeta | null;
  }>;

  /** Fired when fetching items fails. Contains the error message. */
  @Event() uTicketableListError!: EventEmitter<{
    ticketableType?: TicketableType;
    error: string;
  }>;

  @Watch("page")
  @Watch("limit")
  @Watch("filter")
  async fetchData() {
    // Skip when the host app tweaks props before auth lands — otherwise
    // loadData() would surface a "Failed to get ID token" error to the user.
    const auth = await Auth.getInstance();
    if (!auth || !(await auth.isAuthenticated())) return;
    await this.loadData();
  }

  async componentWillLoad() {
    await waitForConfig();
    loadLocales(this.logger);
  }

  async componentDidLoad() {
    await waitForConfig();

    const authInstance = await Auth.getInstance();
    if (await authInstance.isAuthenticated()) {
      await this.loadData();
    }

    this.unsubscribeAuth = authOnChange("token", (newToken: string | null) => {
      if (newToken) {
        this.loadData();
      }
    });
  }

  disconnectedCallback() {
    this.unsubscribeAuth?.();
  }

  private async loadData() {
    this.loading = true;
    this.error = null;

    if (!this.ticketableType) {
      this.logger.error("ticketable-type attribute is required");
      this.error = translateListError("ticketable.errors.fetch_failed", "Failed to load data", "internal_error");
      this.loading = false;
      this.uTicketableListError.emit({ error: this.error });
      return;
    }

    if (this.ticketableType !== "ticket" && this.ticketableType !== "subscription") {
      this.logger.error(`Invalid ticketable-type: ${this.ticketableType}. Must be 'ticket' or 'subscription'`);
      this.error = translateListError("ticketable.errors.fetch_failed", "Failed to load data", "internal_error");
      this.loading = false;
      this.uTicketableListError.emit({ error: this.error });
      return;
    }

    const auth = await Auth.getInstance();
    if (!auth) {
      this.logger.error("Auth instance not found");
      this.error = translateListError("ticketable.errors.fetch_failed", "Failed to load data", "internal_error");
      this.loading = false;
      this.uTicketableListError.emit({ error: this.error });
      return;
    }

    const idToken = await auth.getToken();
    if (typeof idToken !== "string") {
      this.error = translateListError("ticketable.errors.fetch_failed", "Failed to load data", "missing_id_token");
      this.loading = false;
      this.uTicketableListError.emit({ error: this.error });
      return;
    }

    try {
      const unidyClient = await getUnidyClient();

      // URLSearchParams with ';' swapped for '&' lets consumers write compact filter strings.
      const filterArgs: Record<string, string> = Object.fromEntries(new URLSearchParams((this.filter || "").replace(/;/g, "&")).entries());

      const commonArgs = {
        page: this.page,
        perPage: this.limit,
        state: filterArgs.state,
        paymentState: filterArgs.payment_state,
        orderBy: filterArgs.order_by as "starts_at" | "ends_at" | "reference" | "created_at" | undefined,
        orderDirection: filterArgs.order_direction as "asc" | "desc" | undefined,
        serviceId: filterArgs.service_id ? Number(filterArgs.service_id) : undefined,
      };

      const [error, data] =
        this.ticketableType === "ticket"
          ? await unidyClient.tickets.list({
              ...commonArgs,
              ticketCategoryId: filterArgs.ticket_category_id,
            })
          : await unidyClient.subscriptions.list({
              ...commonArgs,
              subscriptionCategoryId: filterArgs.subscription_category_id,
            });

      if (error !== null || !data || !("results" in data)) {
        this.error = translateListError("ticketable.errors.fetch_failed", "Failed to load data", error);
        this.loading = false;
        this.uTicketableListError.emit({ error: this.error });
        return;
      }

      this.items = data.results;
      this.paginationMeta = data.meta;

      if (this.store) {
        this.store.state.paginationMeta = data.meta;
      }

      this.loading = false;

      this.uTicketableListSuccess.emit({ ticketableType: this.ticketableType, items: this.items, paginationMeta: this.paginationMeta });
    } catch (err) {
      this.logger.error("Unexpected error while loading data", err);
      this.error = translateListError("ticketable.errors.fetch_failed", "Failed to load data", "internal_error");
      this.loading = false;
      this.uTicketableListError.emit({ error: this.error });
    }
  }

  private buildRenderConfig() {
    const ticketableType = this.ticketableType;
    return {
      valueTag: "ticketable-value",
      conditionalTag: "ticketable-conditional",
      isCurrencyKey: (key: string) => key === "price",
      resolveCurrency: (item: TicketableItem) => item.currency ?? "EUR",
      skeletonAllText: this.skeletonAllText,
      postProcess: (fragment: DocumentFragment, item: TicketableItem | undefined) => {
        for (const exportEl of fragment.querySelectorAll("u-ticketable-export")) {
          if (item) {
            exportEl.setAttribute("data-ticketable-id", item.id);
            exportEl.setAttribute("data-ticketable-type", ticketableType);
            exportEl.setAttribute("exportable", item.exportable_to_wallet ? "true" : "false");
          } else {
            exportEl.setAttribute("exportable", "false");
          }
        }
      },
    };
  }

  componentDidRender() {
    if (this.target) {
      requestAnimationFrame(() => this.renderToTarget());
    }
  }

  private renderToTarget() {
    const template = this.element.querySelector("template");
    if (!template) return;

    const targetElement = document.querySelector(this.target);
    if (!targetElement) {
      this.logger.warn("targetElement not found");
      return;
    }

    targetElement.innerHTML = "";
    renderListContent({
      target: targetElement,
      template,
      loading: this.loading,
      error: this.error,
      items: this.items,
      skeletonCount: this.skeletonCount || this.limit,
      config: this.buildRenderConfig(),
    });

    if (!this.loading && !this.error && this.items.length === 0) {
      const emptyEl = this.element.querySelector('[slot="empty"]');
      if (emptyEl) {
        const clone = emptyEl.cloneNode(true) as Element;
        clone.removeAttribute("hidden");
        clone.removeAttribute("slot");
        targetElement.appendChild(clone);
      }
    }
  }

  render() {
    if (this.error) {
      this.logger.error(`can't render content: ${this.error}`);
      return (
        <h1>
          {t("errors.prefix")} {this.error}
        </h1>
      );
    }

    const template = this.element.querySelector("template");
    if (!template) {
      this.logger.error("template not found");
      return <h1>No template found - fix config</h1>;
    }

    if (this.target) {
      return (
        <Host>
          <slot />
        </Host>
      );
    }

    if (!this.loading && this.items.length === 0) {
      return (
        <Host>
          <slot name="empty" />
          <slot name="pagination" />
        </Host>
      );
    }

    const container = document.createElement("div");
    const config = this.buildRenderConfig();
    if (this.loading) {
      const skeletonCount = this.skeletonCount || this.limit;
      for (const _item of Array.from({ length: skeletonCount })) {
        container.appendChild(renderFragment(template, undefined, config));
      }
    } else {
      for (const item of this.items) {
        container.appendChild(renderFragment(template, item, config));
      }
    }

    return (
      <Host>
        <div class={this.containerClass} innerHTML={container.innerHTML} />
        <slot name="pagination" />
      </Host>
    );
  }
}
