import { Component, Element, Event, type EventEmitter, Host, h, Prop, State, Watch } from "@stencil/core";
import type { Locale } from "date-fns";
import { format } from "date-fns/format";
import { de } from "date-fns/locale/de";
import { enUS } from "date-fns/locale/en-US";
import { fr } from "date-fns/locale/fr";
import { nlBE } from "date-fns/locale/nl-BE";
import { ro } from "date-fns/locale/ro";
import type { PaginationMeta } from "../../../api";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../logger";
import { unidyState, waitForConfig } from "../../../shared/store/unidy-store";
import type { Subscription } from "../../api/subscriptions";
import type { Ticket } from "../../api/tickets";
import { createPaginationStore, type PaginationStore } from "../../store/pagination-store";
import { createSkeletonLoader, replaceTextNodesWithSkeletons } from "./skeleton-helpers";

const LOCALES: Record<string, Locale> = {
  "en-US": enUS,
  de: de,
  fr: fr,
  "nl-BE": nlBE,
  ro: ro,
};

@Component({ tag: "u-ticketable-list", shadow: false })
export class TicketableList extends UnidyComponent {
  @Element() element: HTMLElement;

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
    this.store = createPaginationStore();
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
          for (const [key, val] of Object.entries(item)) {
            value = value.replaceAll(`{{${key}}}`, val as string);
          }

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
        const value = item[key];
        const formatAttr = valueEl.getAttribute("format");
        const dateFormatAttr = valueEl.getAttribute("date-format");

        let finalValue: string;

        if (typeof value === "object" && value instanceof Date) {
          finalValue = format(value, dateFormatAttr || "yyyy-MM-dd", { locale: LOCALES[unidyState.locale] || de });
        } else if (typeof value === "number" && key === "price") {
          finalValue = new Intl.NumberFormat(unidyState.locale, { style: "currency", currency: item.currency || "EUR" }).format(value);
        } else if (typeof value === "number") {
          finalValue = value.toFixed(2);
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
    const template = this.element.querySelector("template");
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
