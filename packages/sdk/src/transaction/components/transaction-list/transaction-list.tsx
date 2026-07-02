import { Component, Event, type EventEmitter, Host, h, Prop, State, Watch } from "@stencil/core";
import type { PaginationMeta } from "../../../api";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { onChange as authOnChange } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { loadLocales, renderFragment, renderListContent, translateListError } from "../../../shared/list-renderer";
import { createPaginationStore, type PaginationStore } from "../../../shared/store/pagination-store";
import { waitForConfig } from "../../../shared/store/unidy-store";
import type { Transaction } from "../../api/transactions";

@Component({ tag: "u-transaction-list", shadow: false })
export class TransactionList extends UnidyComponent() {
  private unsubscribeAuth?: () => void;

  @State() items: Transaction[] = [];
  @State() loading = true;
  @State() error: string | null = null;

  /** Pagination metadata from the API response. */
  @Prop() paginationMeta: PaginationMeta | null = null;

  /** CSS selector for the target element where items will be rendered. */
  @Prop() target?: string;
  /** CSS classes to apply to the container element. */
  @Prop() containerClass?: string;

  /** Filter string for API queries (e.g., 'state=completed;financial_status=paid'). */
  @Prop({ mutable: true }) filter = "";

  /** Number of items per page. */
  @Prop({ mutable: true }) limit = 10;
  /** Current page number. */
  @Prop({ mutable: true }) page = 1;

  /** Number of skeleton items to show while loading. Defaults to limit. */
  @Prop() skeletonCount?: number;
  /** If true, replaces all text content with skeleton loaders. */
  @Prop() skeletonAllText?: boolean = false;

  /** Pagination store instance for external state management. Created automatically when not provided. */
  @Prop({ mutable: true }) store: PaginationStore | null = null;

  /** Fired when transactions are successfully fetched. Contains items and pagination metadata. */
  @Event() uTransactionListSuccess!: EventEmitter<{
    items: Transaction[];
    paginationMeta: PaginationMeta | null;
  }>;

  /** Fired when fetching transactions fails. Contains the error message. */
  @Event() uTransactionListError!: EventEmitter<{
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
    if (!this.store) {
      this.store = createPaginationStore();
    }
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

    const auth = await Auth.getInstance();
    if (!auth) {
      this.logger.error("Auth instance not found");
      this.error = translateListError("transaction.errors.fetch_failed", "Failed to load transactions", "internal_error");
      this.loading = false;
      this.uTransactionListError.emit({ error: this.error });
      return;
    }

    const idToken = await auth.getToken();
    if (typeof idToken !== "string") {
      this.error = translateListError("transaction.errors.fetch_failed", "Failed to load transactions", "missing_id_token");
      this.loading = false;
      this.uTransactionListError.emit({ error: this.error });
      return;
    }

    try {
      const unidyClient = await getUnidyClient();

      const filterArgs: Record<string, string> = Object.fromEntries(new URLSearchParams((this.filter || "").replace(/;/g, "&")).entries());

      const [error, data] = await unidyClient.transactions.list({
        page: this.page,
        perPage: this.limit,
        state: filterArgs.state,
        financialStatus: filterArgs.financial_status,
        orderType: filterArgs.order_type,
        sourcePlatform: filterArgs.source_platform,
        externalId: filterArgs.external_id,
        orderBy: filterArgs.order_by as "placed_at" | "created_at" | "total" | undefined,
        orderDirection: filterArgs.order_direction as "asc" | "desc" | undefined,
      });

      if (error !== null || !data || !("results" in data)) {
        this.error = translateListError("transaction.errors.fetch_failed", "Failed to load transactions", error);
        this.loading = false;
        this.uTransactionListError.emit({ error: this.error });
        return;
      }

      this.items = data.results;
      this.paginationMeta = data.meta;

      if (this.store) {
        this.store.state.paginationMeta = data.meta;
      }

      this.loading = false;

      this.uTransactionListSuccess.emit({ items: this.items, paginationMeta: this.paginationMeta });
    } catch (err) {
      this.logger.error("Unexpected error while loading transactions", err);
      this.error = translateListError("transaction.errors.fetch_failed", "Failed to load transactions", "internal_error");
      this.loading = false;
      this.uTransactionListError.emit({ error: this.error });
    }
  }

  private buildRenderConfig() {
    return {
      valueTag: "transaction-value",
      conditionalTag: "transaction-conditional",
      isCurrencyKey: (key: string) => {
        const leaf = key.split(".").pop() ?? key;
        return leaf === "total" || leaf === "total_price" || leaf === "unit_price";
      },
      resolveCurrency: (item: Transaction): string => item.currency ?? "EUR",
      skeletonAllText: this.skeletonAllText,
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
