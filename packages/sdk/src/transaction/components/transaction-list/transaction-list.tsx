import { Component, Event, type EventEmitter, Host, h, Prop, State, Watch } from "@stencil/core";
import type { Locale } from "date-fns";
import { format } from "date-fns/format";
import type { PaginationMeta } from "../../../api";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { onChange as authOnChange } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { createSkeletonLoader, replaceTextNodesWithSkeletons } from "../../../shared/skeleton-helpers";
import { unidyState, waitForConfig } from "../../../shared/store/unidy-store";
import type { PaginationStore } from "../../../ticketable/store/pagination-store";
import type { Transaction } from "../../api/transactions";

const LOCALES: Record<string, Locale> = {};

/**
 * Extracts a nested value from an object using a path string.
 * Supports dot notation for object properties and bracket notation for arrays.
 * Paths must use dot notation throughout, e.g., "metadata.foo.bar.[1]"
 */
// biome-ignore lint/suspicious/noExplicitAny: Dynamic nested property access requires any
function getNestedValue(obj: any, path: string): any {
  if (!path || !obj) return undefined;

  const parts = path.split(".").filter(Boolean);
  let result = obj;

  for (const part of parts) {
    if (result == null) return undefined;

    if (part.startsWith("[") && part.endsWith("]")) {
      const indexStr = part.slice(1, -1);
      const index = /^\d+$/.test(indexStr) ? Number.parseInt(indexStr, 10) : indexStr;
      result = result[index];
    } else {
      result = result[part];
    }
  }

  if (typeof result === "object" && result != null && !(result instanceof Date)) {
    return JSON.stringify(result);
  }

  return result;
}

async function loadLocales() {
  await Promise.all([
    !LOCALES.en &&
      import("date-fns/locale/en-GB").then((module) => {
        LOCALES.en = module.enGB;
      }),
    !LOCALES.de &&
      import("date-fns/locale/de").then((module) => {
        LOCALES.de = module.de;
      }),
    !LOCALES.fr &&
      import("date-fns/locale/fr").then((module) => {
        LOCALES.fr = module.fr;
      }),
    !LOCALES.nl_be &&
      import("date-fns/locale/nl-BE").then((module) => {
        LOCALES.nl_be = module.nlBE;
      }),
    !LOCALES.ro &&
      import("date-fns/locale/ro").then((module) => {
        LOCALES.ro = module.ro;
      }),
    !LOCALES.sv &&
      import("date-fns/locale/sv").then((module) => {
        LOCALES.sv = module.sv;
      }),
  ]);
}

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

  @Watch("page")
  @Watch("limit")
  @Watch("filter")
  async fetchData() {
    await this.loadData();
  }

  /** Pagination store instance for external state management. */
  @Prop() store: PaginationStore | null = null;

  /** Fired when transactions are successfully fetched. Contains items and pagination metadata. */
  @Event() uTransactionListSuccess!: EventEmitter<{
    items: Transaction[];
    paginationMeta: PaginationMeta | null;
  }>;

  /** Fired when fetching transactions fails. Contains the error message. */
  @Event() uTransactionListError!: EventEmitter<{
    error: string;
  }>;

  async componentWillLoad() {
    await waitForConfig();
    loadLocales().catch((err) => {
      console.error("[u-transaction-list] Failed to load locales, falling back to 'en'", err);
    });
  }

  async componentDidLoad() {
    this.logger.trace("start componentDidLoad");
    await waitForConfig();
    this.logger.trace("UnidyConfig loaded, start to load data");

    const authInstance = await Auth.getInstance();

    if (await authInstance.isAuthenticated()) {
      await this.loadData();
      this.logger.debug(`data loaded, items: ${this.items}, paginationMeta: ${this.paginationMeta}`);
    } else {
      this.logger.debug("user is not authenticated, skipping data load");
    }

    // Listen for auth changes to refresh data when user logs in
    this.unsubscribeAuth = authOnChange("token", (newToken: string | null) => {
      if (newToken) {
        this.logger.debug("auth token changed, refreshing data");
        this.loadData();
      }
    });
  }

  disconnectedCallback() {
    this.unsubscribeAuth?.();
  }

  private async loadData() {
    this.loading = true;

    const auth = await Auth.getInstance();
    if (!auth) {
      this.error = "[u-transaction-list] Auth instance not found";
      this.loading = false;
      return;
    }

    const idToken = await auth.getToken();
    if (typeof idToken !== "string") {
      this.error = "[u-transaction-list] Failed to get ID token";
      this.loading = false;
      return;
    }

    try {
      const unidyClient = await getUnidyClient();

      // Parse filter string into typed args using URLSearchParams (treats ; as separator)
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
        this.error = this.getTranslatedError(error);
        this.loading = false;
        this.uTransactionListError.emit({ error: this.error });
        return;
      }

      this.items = data.results;
      this.paginationMeta = data.meta;

      // Update the store with pagination data
      if (this.store) {
        this.store.state.paginationMeta = data.meta;
      }

      this.loading = false;

      this.uTransactionListSuccess.emit({ items: this.items, paginationMeta: this.paginationMeta });
    } catch (err) {
      this.error = err instanceof Error ? err.message : "[u-transaction-list] An error occurred";
      this.loading = false;
      this.uTransactionListError.emit({ error: this.error });
    }
  }

  private getTranslatedError(error: string | null): string {
    if (!error) {
      return t("transaction.errors.fetch_failed", { defaultValue: "Failed to load transactions" });
    }

    const errorMessages: Record<string, string> = {
      connection_failed: t("errors.connection_failed", { defaultValue: "Connection failed. Please check your internet connection." }),
      schema_validation_error: t("errors.schema_validation", { defaultValue: "Invalid data received from server." }),
      internal_error: t("errors.internal", { defaultValue: "An internal error occurred." }),
      missing_id_token: t("errors.unauthorized", { defaultValue: "You must be logged in to view this content." }),
      unauthorized: t("errors.unauthorized", { defaultValue: "You are not authorized to view this content." }),
      server_error: t("errors.server", { defaultValue: "A server error occurred. Please try again later." }),
      invalid_response: t("errors.invalid_response", { defaultValue: "Invalid response from server." }),
    };

    return errorMessages[error] || t("errors.unknown", { defaultValue: "An unknown error occurred." });
  }

  private renderFragment(template: HTMLTemplateElement, item?: Transaction): DocumentFragment {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const isSkeleton = !item;

    // Process unidy-attr-* attribute substitutions.
    for (const elem of fragment.querySelectorAll("[unidy-attr]")) {
      for (const [unidyAttr, newValue] of Array.from(elem.attributes)
        .filter((attr) => attr.name.startsWith("unidy-attr-"))
        .map((attr) => {
          if (isSkeleton) {
            return [attr, "#"] as const;
          }

          let value = attr.value;
          const templateRegex = /\{\{([^}]+)\}\}/g;
          value = value.replace(templateRegex, (match, path) => {
            const nestedValue = getNestedValue(item, path.trim());
            return nestedValue != null ? String(nestedValue) : match;
          });

          return [attr, value] as const;
        })) {
        elem.setAttribute(unidyAttr.name.replace("unidy-attr-", ""), newValue);
        elem.removeAttribute(unidyAttr.name);
      }
    }

    if (isSkeleton && this.skeletonAllText) {
      replaceTextNodesWithSkeletons(fragment, { skipInsideTags: ["transaction-value"] });
    }

    for (const valueEl of fragment.querySelectorAll("transaction-value")) {
      if (isSkeleton) {
        valueEl.innerHTML = createSkeletonLoader("Sample Text");
      } else {
        const key = valueEl.getAttribute("name");
        if (!key) continue;
        const value = getNestedValue(item, key);
        const formatAttr = valueEl.getAttribute("format");
        const dateFormatAttr = valueEl.getAttribute("date-format");

        let finalValue: string;

        if (typeof value === "object" && value instanceof Date) {
          finalValue = format(value, dateFormatAttr || "yyyy-MM-dd", { locale: LOCALES[unidyState.locale] || LOCALES.en });
        } else if (
          typeof value === "number" &&
          (key === "total" || key === "unit_price" || key.endsWith(".total") || key.endsWith(".unit_price"))
        ) {
          finalValue = new Intl.NumberFormat(unidyState.locale, { style: "currency", currency: item.currency || "EUR" }).format(value);
        } else if (typeof value === "number") {
          if (Number.isInteger(value)) {
            finalValue = value.toString();
          } else {
            finalValue = value.toFixed(2);
          }
        } else if (value != null) {
          finalValue = String(value);
        } else {
          finalValue = valueEl.getAttribute("default") || "";
        }

        if (formatAttr) {
          finalValue = formatAttr.replaceAll("{{value}}", finalValue);
        }

        valueEl.textContent = finalValue;
      }
    }

    // Process transaction-conditional elements.
    // Shows/hides content based on transaction property values.
    // Example:
    //   <transaction-conditional when="metadata.vip">
    //     <span class="vip-badge">VIP</span>
    //   </transaction-conditional>
    const conditionalElements = Array.from(fragment.querySelectorAll("transaction-conditional"));
    for (const conditionalEl of conditionalElements) {
      const whenAttr = conditionalEl.getAttribute("when");
      if (!whenAttr) {
        conditionalEl.remove();
        continue;
      }

      if (isSkeleton) {
        conditionalEl.remove();
        continue;
      }

      const value = getNestedValue(item, whenAttr);
      const isTruthy = Boolean(value);

      if (isTruthy) {
        const parent = conditionalEl.parentNode;
        if (parent) {
          while (conditionalEl.firstChild) {
            parent.insertBefore(conditionalEl.firstChild, conditionalEl);
          }
          parent.removeChild(conditionalEl);
        }
      } else {
        conditionalEl.remove();
      }
    }

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
    const template = this.element.querySelector("template");
    if (!template) return;

    const targetElement = document.querySelector(this.target);
    if (!targetElement) {
      this.logger.warn("targetElement not found");
      return;
    }

    targetElement.innerHTML = "";
    this.renderContent(targetElement, template);
  }

  private renderContent(target: Element, template: HTMLTemplateElement) {
    if (this.loading) {
      const skeletonCount = this.skeletonCount || this.limit;
      for (const _item of Array.from({ length: skeletonCount })) {
        target.appendChild(this.renderFragment(template));
      }
    } else if (!this.error) {
      for (const item of this.items) {
        target.appendChild(this.renderFragment(template, item));
      }
    } else {
      this.logger.error(`failed to load content: ${this.error}`);
      target.innerHTML = `<h1>${t("errors.prefix")} ${this.error}</h1>`;
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

    const element = document.createElement("div");
    this.renderContent(element, template);

    return (
      <Host>
        <div class={this.containerClass} innerHTML={element.innerHTML} />
        <slot name="pagination" />
      </Host>
    );
  }
}
