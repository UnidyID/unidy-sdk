/**
 * Checks if a Stencil component's slot has content.
 * Use this in components to render fallback content when a slot is empty.
 *
 * @param element - The host element of the component (accessed via @Element())
 * @returns true if the slot has content, false otherwise
 */
export function hasSlotContent(element: HTMLElement): boolean {
  return element.hasChildNodes() && element.textContent?.trim() !== "";
}
