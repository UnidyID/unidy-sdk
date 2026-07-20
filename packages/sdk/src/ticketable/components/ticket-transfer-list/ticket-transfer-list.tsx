import { Component, Event, type EventEmitter, Host, h, Listen, Prop, State, Watch } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { onChange as authOnChange } from "../../../auth/store/auth-store";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../shared/base/component";
import { loadLocales, renderFragment, renderListContent } from "../../../shared/list-renderer";
import { waitForConfig } from "../../../shared/store/unidy-store";
import type { TicketTransfer } from "../../api/schemas";
import { translateTransferError } from "../../transfer-error";

export type TicketTransferDirection = "incoming" | "outgoing";

/**
 * Lists the user's pending ticket transfers for one direction.
 *
 * Renders a user-supplied `<template>` per transfer with `<transfer-value>`
 * substitutions (e.g. `ticket.title`, `sender_email`, `expires_at`) and
 * `<transfer-conditional>` blocks. `u-ticket-transfer-action` elements inside
 * the template get the transfer `token` stamped automatically, and the list
 * refetches after a successful action.
 */
@Component({ tag: "u-ticket-transfer-list", shadow: false })
export class TicketTransferList extends UnidyComponent() {
  private unsubscribeAuth?: () => void;

  @State() items: TicketTransfer[] = [];
  @State() loading = true;
  @State() error: string | null = null;

  /** Which side of the user's pending transfers to display ('incoming' or 'outgoing'). */
  @Prop() direction!: TicketTransferDirection;

  /** CSS selector for the target element where items will be rendered. */
  @Prop() target?: string;
  /** CSS classes to apply to the container element. */
  @Prop() containerClass?: string;

  /** Number of skeleton items to show while loading. */
  @Prop() skeletonCount = 3;
  /** If true, replaces all text content with skeleton loaders. */
  @Prop() skeletonAllText?: boolean = false;

  /** Fired when transfers are successfully fetched. Contains the direction and items. */
  @Event() uTicketTransferListSuccess!: EventEmitter<{
    direction: TicketTransferDirection;
    items: TicketTransfer[];
  }>;

  /** Fired when fetching transfers fails. Contains the error message. */
  @Event() uTicketTransferListError!: EventEmitter<{
    direction?: TicketTransferDirection;
    error: string;
  }>;

  @Watch("direction")
  async fetchData() {
    // Skip when the host app tweaks props before auth lands — otherwise
    // loadData() would surface a "Failed to get ID token" error to the user.
    const auth = await Auth.getInstance();
    if (!auth || !(await auth.isAuthenticated())) return;
    await this.loadData();
  }

  /** Refetch when a transfer action inside this list succeeds (accept/decline/cancel). */
  @Listen("uTicketTransferActionSuccess")
  async handleActionSuccess() {
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

    if (this.direction !== "incoming" && this.direction !== "outgoing") {
      this.logger.error(`Invalid direction: ${this.direction}. Must be 'incoming' or 'outgoing'`);
      this.error = translateTransferError("internal_error");
      this.loading = false;
      this.uTicketTransferListError.emit({ error: this.error });
      return;
    }

    try {
      const unidyClient = await getUnidyClient();
      const [error, data] = await unidyClient.ticketTransfers.list();

      if (error !== null || !data || !("incoming" in data)) {
        this.error = translateTransferError(error ?? "invalid_response");
        this.loading = false;
        this.uTicketTransferListError.emit({ direction: this.direction, error: this.error });
        return;
      }

      this.items = data[this.direction];
      this.loading = false;

      this.uTicketTransferListSuccess.emit({ direction: this.direction, items: this.items });
    } catch (err) {
      this.logger.error("Unexpected error while loading transfers", err);
      this.error = translateTransferError("internal_error");
      this.loading = false;
      this.uTicketTransferListError.emit({ direction: this.direction, error: this.error });
    }
  }

  private buildRenderConfig() {
    return {
      valueTag: "transfer-value",
      conditionalTag: "transfer-conditional",
      isCurrencyKey: (key: string) => key === "ticket.price",
      resolveCurrency: (item: TicketTransfer) => item.ticket.currency ?? "EUR",
      skeletonAllText: this.skeletonAllText,
      postProcess: (fragment: DocumentFragment, item: TicketTransfer | undefined) => {
        for (const actionEl of fragment.querySelectorAll("u-ticket-transfer-action")) {
          if (item) {
            actionEl.setAttribute("token", item.token);
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
      skeletonCount: this.skeletonCount,
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

    if (!this.loading && !this.error && this.items.length === 0) {
      return (
        <Host>
          <slot name="empty" />
          <slot />
        </Host>
      );
    }

    const container = document.createElement("div");
    const config = this.buildRenderConfig();
    if (this.loading) {
      for (const _item of Array.from({ length: this.skeletonCount })) {
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
        {/* A slot outlet must exist in every state — without one, Stencil's
            slot handling never runs and the slot="empty" content is shown
            alongside the rendered items/skeletons instead of being hidden. */}
        <slot />
      </Host>
    );
  }
}
