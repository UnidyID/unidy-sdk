import { type MixedInCtor, h } from "@stencil/core";

/**
 * Interface for the hasSlot functionality provided by the HasSlotFactory mixin.
 */
export interface WithHasSlot {
  hasSlot: boolean;
  checkSlotContent(element: HTMLElement): void;
}

/**
 * Checks if a Stencil component's slot has content.
 *
 * IMPORTANT: (for shadow: false components)
 * This must be called in `componentWillLoad()` and cached.
 * After the first render, `element.childNodes` will contain both user-provided slot content
 * AND the component's rendered internal elements (like <button>), causing false positives.
 *
 * @see https://stenciljs.com/docs/templating-jsx#slots-outside-shadow-dom
 */
function hasSlotContent(element: HTMLElement): boolean {
  if (!element.hasChildNodes()) return false;

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) return true;
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) return true;
  }

  return false;
}

/**
 * Stencil mixin factory that adds slot content detection to a component.
 * Components using this mixin get a `hasSlot` property and a `checkSlotContent` method.
 *
 * IMPORTANT: You must call `this.checkSlotContent(this.el)` in `componentWillLoad()`.
 * The component must have `@Element() el!: HTMLElement;` defined.
 */
// biome-ignore lint/suspicious/noExplicitAny: Mixin factory requires any for Base parameter
export const HasSlotFactory = <B extends MixedInCtor>(Base: B = Object as any) => {
  class HasSlotMixin extends Base {
    hasSlot = false;

    /**
     * Checks if the component's slot has content and stores the result.
     * Must be called in componentWillLoad() before the first render.
     *
     * @param element - The host element of the component (from @Element() decorator)
     */
    checkSlotContent(element: HTMLElement): void {
      this.hasSlot = hasSlotContent(element);
    }
  }
  return HasSlotMixin;
};

/**
 * Removes a query parameter from the current URL and updates the browser history.
 * Uses `replaceState` to avoid adding a new history entry.
 *
 * @param param - The name of the query parameter to remove
 * @returns The value of the removed parameter, or null if it wasn't present
 *
 * @example
 * ```ts
 * // URL: https://example.com?token=abc123&foo=bar
 * const token = clearUrlParam("token");
 * // token = "abc123"
 * // URL is now: https://example.com?foo=bar
 * ```
 */
export function clearUrlParam(param: string): string | null {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(param);

  if (value) {
    url.searchParams.delete(param);
    window.history.replaceState(null, "", url.toString());
  }

  return value;
}

/**
 * Renders button content with proper slot/loading handling for shadow: false components.
 * When there's slot content, we must always render the <slot /> element to capture it,
 * otherwise the slotted content will be visible even during loading state.
 *
 * @param hasSlot - Whether the component has slotted content
 * @param loading - Whether the component is in a loading state
 * @param defaultText - The default text to display when there's no slot content
 * @returns JSX content for the button
 *
 * @example
 * ```tsx
 * render() {
 *   return (
 *     <button>
 *       {renderButtonContent(this.hasSlot, this.loading, t("buttons.submit"))}
 *     </button>
 *   );
 * }
 * ```
 */
export function renderButtonContent(hasSlot: boolean, loading: boolean, defaultText: string) {
  if (hasSlot) {
    return [
      loading && <u-spinner key="spinner" />,
      <span key="slot" style={{ display: loading ? "none" : "contents" }}>
        <slot />
      </span>,
    ];
  }

  if (loading) {
    return <u-spinner />;
  }

  return defaultText;
}
