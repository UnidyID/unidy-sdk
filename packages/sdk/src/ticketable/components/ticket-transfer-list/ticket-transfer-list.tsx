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
  /** Monotonic id guarding overlapping loadData() calls — only the latest applies its response. */
  private loadId = 0;
  /** The element last populated via `target`, so it can be cleared when the target changes or the list unmounts. */
  private lastTargetElement: Element | null = null;

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

  @Watch("target")
  targetChanged() {
    // The old container would otherwise keep stale content (including live
    // action buttons whose events no longer reach this list).
    this.clearTargetElement();
  }

  @Watch("direction")
  async fetchData() {
    // Supersede any in-flight load immediately so its response can't apply
    // items for the old direction while we await the auth checks below.
    this.loadId++;
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
    // Deferred one frame: disconnectedCallback also fires on a synchronous DOM
    // move (reparenting), where Stencil never re-renders to repopulate the
    // target — only clear it when the element is really gone.
    requestAnimationFrame(() => {
      if (!this.element.isConnected) {
        this.clearTargetElement();
      }
    });
  }

  private clearTargetElement() {
    if (this.lastTargetElement) {
      this.lastTargetElement.innerHTML = "";
      this.lastTargetElement = null;
    }
  }

  private async loadData() {
    const loadId = ++this.loadId;
    this.loading = true;
    this.error = null;

    // Capture the validated direction — the prop can change while the request
    // is in flight (the @Watch then starts a new load that supersedes this one).
    const direction = this.direction;
    if (direction !== "incoming" && direction !== "outgoing") {
      this.logger.error(`Invalid direction: ${direction}. Must be 'incoming' or 'outgoing'`);
      this.error = translateTransferError("internal_error");
      this.loading = false;
      this.uTicketTransferListError.emit({ error: this.error });
      return;
    }

    try {
      const unidyClient = await getUnidyClient();
      const [error, data] = await unidyClient.ticketTransfers.list();

      if (loadId !== this.loadId) return;

      if (error !== null || !data || !("incoming" in data)) {
        this.error = translateTransferError(error ?? "invalid_response");
        this.loading = false;
        this.uTicketTransferListError.emit({ direction, error: this.error });
        return;
      }

      this.items = data[direction];
      this.loading = false;

      this.uTicketTransferListSuccess.emit({ direction, items: this.items });
    } catch (err) {
      if (loadId !== this.loadId) return;
      this.logger.error("Unexpected error while loading transfers", err);
      this.error = translateTransferError("internal_error");
      this.loading = false;
      this.uTicketTransferListError.emit({ direction, error: this.error });
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
          } else {
            actionEl.setAttribute("disabled", "true");
          }
        }
      },
    };
  }

  componentDidRender() {
    if (this.target) {
      // Stencil re-renders detached components on late state writes; without the
      // isConnected guard this deferred callback would repopulate the external
      // target after disconnectedCallback already cleared it.
      requestAnimationFrame(() => {
        if (this.element.isConnected) {
          this.renderToTarget();
        }
      });
    }
  }

  private renderToTarget() {
    const template = this.element.querySelector("template");
    if (!template) return;

    const targetElement = document.querySelector(this.target);
    if (!targetElement) {
      this.logger.warn("targetElement not found");
      this.lastTargetElement = null;
      return;
    }

    if (this.lastTargetElement && this.lastTargetElement !== targetElement) {
      this.lastTargetElement.innerHTML = "";
    }
    this.lastTargetElement = targetElement;

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
