import { Component, Element, Event, type EventEmitter, Host, h, Prop, State, Watch } from "@stencil/core";
import type { Locale } from "date-fns";
import { format } from "date-fns/format";
import type { PaginationMeta } from "../../../api";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { onChange as authOnChange } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../logger";
import { unidyState, waitForConfig } from "../../../shared/store/unidy-store";
import type { Subscription } from "../../api/subscriptions";
import type { Ticket } from "../../api/tickets";
import type { PaginationStore } from "../../store/pagination-store";
import { createSkeletonLoader, replaceTextNodesWithSkeletons } from "./skeleton-helpers";

const LOCALES: Record<string, Locale> = {};

/**
 * Extracts a nested value from an object using a path string.
 * Supports dot notation for object properties and bracket notation for arrays.
 * Paths must use dot notation throughout, e.g., "metadata.foo.bar.[1]"
 * Examples:
 *   - "metadata.foo.bar" -> item.metadata.foo.bar
 *   - "metadata.foo.bar.[1]" -> item.metadata.foo.bar[1]
 *   - "wallet_export.[0].address" -> item.wallet_export[0].address
 */
// biome-ignore lint/suspicious/noExplicitAny: Dynamic nested property access requires any
function getNestedValue(obj: any, path: string): any {
  if (!path || !obj) return undefined;

  // Split by dots and process each part
  const parts = path.split(".").filter(Boolean);
  let result = obj;

  for (const part of parts) {
    if (result == null) return undefined;

    // Check if this part is an array index like "[1]"
    if (part.startsWith("[") && part.endsWith("]")) {
      const indexStr = part.slice(1, -1);
      const index = /^\d+$/.test(indexStr) ? Number.parseInt(indexStr, 10) : indexStr;
      result = result[index];
    } else {
      result = result[part];
    }
  }

  if (typeof result === "object" && result != null) {
    return JSON.stringify(result);
  }

  return result;
}

async function loadLocales() {
  // TODO: This should be pulled into a shared component
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

@Component({ tag: "u-ticketable-list", shadow: false })
export class TicketableList extends UnidyComponent {
  @Element() el: HTMLElement;

  private unsubscribeAuth?: () => void;

  // TODO: move into a generic store, since we'll have this kind of fetching all over the app (also implement SWR and other things inside of it)
  @State() items: Subscription[] | Ticket[] = [];
  @State() loading = true;
  @State() error: string | null = null;
  @Prop() paginationMeta: PaginationMeta | null = null;

  @Prop() target?: string;
  @Prop() containerClass?: string;

  // TODO: add a component that can override this
  @Prop({ mutable: true }) filter = "";

  // TODO: Add pagination component to override all of this
  @Prop({ mutable: true }) limit = 10;
  @Prop({ mutable: true }) page = 1;

  @Prop() skeletonCount?: number;
  @Prop() skeletonAllText?: boolean = false;
  @Prop() ticketableType!: "ticket" | "subscription";

  @Watch("page")
  @Watch("limit")
  @Watch("filter")
  async fetchData() {
    await this.loadData();
  }

  @Prop() store: PaginationStore | null = null;

  @Event() uTicketableListSuccess!: EventEmitter<{
    ticketableType: "ticket" | "subscription";
    items: Subscription[] | Ticket[];
    paginationMeta: PaginationMeta | null;
  }>;

  @Event() uTicketableListError!: EventEmitter<{
    ticketableType?: "ticket" | "subscription";
    error: string;
  }>;

  async componentWillLoad() {
    await waitForConfig();
    loadLocales().catch((err) => {
      console.error("[u-ticketable-list] Failed to load locales, falling back to 'en'", err);
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

    if (!this.ticketableType) {
      this.error = "[u-ticketable-list] ticketable-type attribute is required";
      this.loading = false;
      this.uTicketableListError.emit({ error: this.error });
      return;
    }

    if (this.ticketableType !== "ticket" && this.ticketableType !== "subscription") {
      this.error = `[u-ticketable-list] Invalid ticketable-type: ${this.ticketableType}. Must be 'ticket' or 'subscription'`;
      this.loading = false;
      this.uTicketableListError.emit({ error: this.error });
      return;
    }

    // TODO: Add a simple shared way of doing this
    const auth = await Auth.getInstance();
    if (!auth) {
      this.error = "[u-ticketable-list] Auth instance not found";
      this.loading = false;
      return;
    }

    // TODO: Handle auth on change THAT SHOULD EXIST ON THE AUTH INSTANCE

    const idToken = await auth.getToken();
    if (typeof idToken !== "string") {
      this.error = "[u-ticketable-list] Failed to get ID token";
      this.loading = false;
      return;
    }

    try {
      const unidyClient = await getUnidyClient();

      // Parse filter string into typed args using URLSearchParams (treats ; as separator)
      const filterArgs: Record<string, string> = Object.fromEntries(new URLSearchParams((this.filter || "").replace(/;/g, "&")).entries());

      // Common args for both services
      const commonArgs = {
        page: this.page,
        perPage: this.limit,
        state: filterArgs.state,
        paymentState: filterArgs.payment_state,
        orderBy: filterArgs.order_by as "starts_at" | "ends_at" | "reference" | "created_at" | undefined,
        orderDirection: filterArgs.order_direction as "asc" | "desc" | undefined,
        serviceId: filterArgs.service_id ? Number(filterArgs.service_id) : undefined,
      };

      // Call the appropriate service with type-safe args
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
        this.error = this.getTranslatedError(error);
        this.loading = false;
        this.uTicketableListError.emit({ error: this.error });
        return;
      }

      this.items = data.results;
      this.paginationMeta = data.meta;

      // Update the store with pagination data
      if (this.store) {
        this.store.state.paginationMeta = data.meta;
      }

      this.loading = false;

      this.uTicketableListSuccess.emit({ ticketableType: this.ticketableType, items: this.items, paginationMeta: this.paginationMeta });
    } catch (err) {
      this.error = err instanceof Error ? err.message : "[u-ticketable-list] An error occurred";
      this.loading = false;
      this.uTicketableListError.emit({ error: this.error });
    }
  }

  private getTranslatedError(error: string | null): string {
    if (!error) {
      return t("ticketable.errors.fetch_failed", { defaultValue: "Failed to load data" });
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

  private renderFragment(template: HTMLTemplateElement, item?: Subscription | Ticket): DocumentFragment {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const isSkeleton = !item;

    for (const elem of fragment.querySelectorAll("[unidy-attr]")) {
      for (const [unidyAttr, newValue] of Array.from(elem.attributes)
        .filter((attr) => attr.name.startsWith("unidy-attr-"))
        .map((attr) => {
          if (isSkeleton) {
            return [attr, "#"] as const;
          }

          let value = attr.value;
          // Find all template strings like {{path}} and replace them with nested values
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
      replaceTextNodesWithSkeletons(fragment);
    }

    for (const valueEl of fragment.querySelectorAll("ticketable-value")) {
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
        } else if (typeof value === "number" && key === "price") {
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

    // Process ticketable-conditional elements
    // Shows/hides content based on item property values.
    // Example:
    //   <ticketable-conditional when="metadata.vip">
    //     <span class="vip-badge">VIP</span>
    //   </ticketable-conditional>
    // The children are rendered only if the "when" property is truthy.
    // Convert to array to avoid issues when modifying the DOM
    const conditionalElements = Array.from(fragment.querySelectorAll("ticketable-conditional"));
    for (const conditionalEl of conditionalElements) {
      const whenAttr = conditionalEl.getAttribute("when");
      if (!whenAttr) {
        // If no 'when' attribute, remove the element
        conditionalEl.remove();
        continue;
      }

      if (isSkeleton) {
        // For skeleton state, remove conditionals
        conditionalEl.remove();
        continue;
      }

      // Check if the item property is truthy
      const value = getNestedValue(item, whenAttr);
      const isTruthy = Boolean(value);

      if (isTruthy) {
        // Replace the conditional element with its children
        const parent = conditionalEl.parentNode;
        if (parent) {
          // Move all children before the conditional element
          while (conditionalEl.firstChild) {
            parent.insertBefore(conditionalEl.firstChild, conditionalEl);
          }
          // Remove the conditional element
          parent.removeChild(conditionalEl);
        }
      } else {
        // Remove the conditional element and its children
        conditionalEl.remove();
      }
    }

    // Set ticketable context on export buttons
    for (const exportEl of fragment.querySelectorAll("u-ticketable-export")) {
      if (item) {
        exportEl.setAttribute("data-ticketable-id", item.id);
        exportEl.setAttribute("data-ticketable-type", this.ticketableType);
        exportEl.setAttribute("exportable", item.exportable_to_wallet ? "true" : "false");
      } else {
        exportEl.setAttribute("exportable", "false");
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
    const template = this.el.querySelector("template");
    if (!template) return;

    const targetElement = document.querySelector(this.target);
    if (!targetElement) {
      this.logger.warn("targetElement not found");
      return;
    }

    // Clear existing content
    targetElement.innerHTML = "";
    this.renderContent(targetElement, template);
  }

  private renderContent(target: Element, template: HTMLTemplateElement) {
    if (this.loading) {
      // Use skeletonCount if provided, otherwise use limit
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

    const template = this.el.querySelector("template");
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
