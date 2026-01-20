import { h } from "@stencil/core";

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
 *   const hasSlot = this.el.childNodes.length > 0;
 *   return (
 *     <button>
 *       {renderButtonContent(hasSlot, this.loading, t("buttons.submit"))}
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
