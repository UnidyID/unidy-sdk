/**
 * Checks if a Stencil component's slot has content.
 * Use this in components to render fallback content when a slot is empty.
 *
 * @param element - The host element of the component (accessed via @Element())
 * @returns true if the slot has content, false otherwise
 */
export function hasSlotContent(element: HTMLElement): boolean {
  return element.hasChildNodes() && !!element.textContent?.trim();
}

export function clearUrlParam(param: string): string | null {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(param);

  if (value) {
    url.searchParams.delete(param);
    window.history.replaceState(null, "", url.toString());
  }

  return value;
}
