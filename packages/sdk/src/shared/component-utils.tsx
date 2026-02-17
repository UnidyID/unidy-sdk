import { Fragment, h } from "@stencil/core";

/**
 * Returns slot fallback content with proper loading handling for shadow: false components.
 * When there's slot content, we must always render the <slot /> element to capture it,
 * otherwise the slotted content will be visible even during loading state.
 *
 * @param fallbackText - The default text to display when there's no slot content
 * @param options - Options object containing hasSlot and loading state
 * @returns JSX content for the slot fallback
 *
 * @example
 * ```tsx
 * render() {
 *   return (
 *     <button>
 *       {slotFallbackText(t("buttons.submit"), { hasSlot: this.hasSlot, loading: this.isLoading() })}
 *     </button>
 *   );
 * }
 * ```
 */
export function slotFallbackText(fallbackText: string, { hasSlot, loading = false }: { hasSlot: boolean; loading?: boolean }) {
  if (hasSlot) {
    return (
      <Fragment>
        {loading && <u-spinner key="spinner" />}
        <span key="slot" style={{ display: loading ? "none" : "contents" }}>
          <slot />
        </span>
      </Fragment>
    );
  }

  if (loading) {
    return <u-spinner />;
  }

  return fallbackText;
}
