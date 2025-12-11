import { Component, h, State, Element, Host, Prop, Watch } from "@stencil/core";
import { ApiClient, type PaginationMeta } from "../../../api";
import type { Locale } from "date-fns";
import { format } from "date-fns/format";
import { enUS } from "date-fns/locale/en-US";
import { de } from "date-fns/locale/de";
import { fr } from "date-fns/locale/fr";
import { nlBE } from "date-fns/locale/nl-BE";
import { ro } from "date-fns/locale/ro";

import { type Ticket, TicketsService } from "../../api/tickets";
import { type Subscription, SubscriptionsService } from "../../api/subscriptions";
import { createSkeletonLoader, replaceTextNodesWithSkeletons } from "./skeleton-helpers";
import { createPaginationStore, type PaginationStore } from "../../store/pagination-store";

const LOCALES: Record<string, Locale> = {
  "en-US": enUS,
  de: de,
  fr: fr,
  "nl-BE": nlBE,
  ro: ro,
};

@Component({ tag: "u-ticketable-list", shadow: false })
export class TicketableList {
  @Element() element: HTMLElement;

  // TODO: move into a generic store, since we'll have this kind of fetching all over the app (also implement SWR and other things inside of it)
  @State() items: Subscription[] | Ticket[] = [];
  @State() loading = true;
  @State() error: string | null = null;
  @Prop() store: PaginationStore = createPaginationStore();

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

  async componentWillLoad() {
    await waitForConfig();
  }

  // TODO[LOGGING]: Log this to console (use shared logger)
  async componentDidLoad() {
    await this.loadData();
  }

  private async loadData() {
    this.loading = true;

    if (!unidyState.baseUrl || !unidyState.apiKey) {
      this.error = "[u-ticketable-list] baseUrl and apiKey are required in the unidy-store";
      this.loading = false;
      return;
    }

    if (!this.ticketableType) {
      this.error = "[u-ticketable-list] ticketable-type attribute is required";
      this.loading = false;
      return;
    }

    if (this.ticketableType !== "ticket" && this.ticketableType !== "subscription") {
      this.error = `[u-ticketable-list] Invalid ticketable-type: ${this.ticketableType}. Must be 'ticket' or 'subscription'`;
      this.loading = false;
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
      const apiClient = new ApiClient(unidyState.baseUrl, unidyState.apiKey);
      const service =
        this.ticketableType === "ticket" ? new TicketsService(apiClient, idToken) : new SubscriptionsService(apiClient, idToken);

      const response = await service.list(
        {},
        {
          page: this.page,
          limit: this.limit,
          ...Object.fromEntries((this.filter || "").split(";").map((pair) => pair.split("="))),
        },
      );

      if (!response.success || !response.data) {
        this.error =
          response.error instanceof Error
            ? response.error.message
            : response.error || `[u-ticketable-list] Failed to fetch ${this.ticketableType}s`;
        this.loading = false;
        return;
      }

      this.items = response.data.results;
      this.store.state.paginationMeta = response.data.meta;

      this.loading = false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : "[u-ticketable-list] An error occurred";
      this.loading = false;
    }
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
      // TODO[LOGGING]: Log this to console (use shared logger)
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
      // TODO[LOGGING]: Log this to console (use shared logger)
      target.innerHTML = "<h1>Error: {this.error}</h1>";
    }
  }

  render() {
    if (this.error) {
      // TODO[LOGGING]: Log this to console (use shared logger)
      return <h1>Error: {this.error}</h1>;
    }

    const template = this.element.querySelector("template");
    if (!template) {
      // TODO[LOGGING]: Log this to console (use shared logger)
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
