import { h } from "@stencil/core";

/**
 * Checks if a Stencil component's slot has content.
 * Use this in components to render fallback content when a slot is empty.
 *
 * IMPORTANT: (for shadow: false components)
 * You MUST call this in `componentWillLoad()` and cache the result in an instance property.
 * After the first render, `element.childNodes` will contain both user-provided slot content
 * AND the component's rendered internal elements (like <button>), causing false positives.
 *
 * Take a look at the https://stenciljs.com/docs/templating-jsx#slots-outside-shadow-dom
 *
 * @param element - The host element of the component (accessed via @Element())
 * @returns true if the slot has content, false otherwise
 */
export function hasSlotContent(element: HTMLElement): boolean {
  if (!element.hasChildNodes()) return false;

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) return true;
    if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) return true;
  }

  return false;
}

export interface ButtonContentOptions {
  /** Whether the component has slotted content */
  hasSlot: boolean;
  /** Whether the component is in a loading state */
  loading: boolean;
  /** The default text to display when there's no slot content */
  defaultText: string;
}

/**
 * Returns button content with proper slot/loading handling for shadow: false components.
 * When there's slot content, we must always render the <slot /> element to capture it,
 * otherwise the slotted content will be visible even during loading state.
 *
 * @returns JSX content for the button
 *
 * @example
 * ```tsx
 * render() {
 *   return (
 *     <button>
 *       {buttonContent({ hasSlot: this.hasSlot, loading: this.loading, defaultText: t("buttons.submit") })}
 *     </button>
 *   );
 * }
 * ```
 */
export function buttonContent({ hasSlot, loading, defaultText }: ButtonContentOptions) {
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
