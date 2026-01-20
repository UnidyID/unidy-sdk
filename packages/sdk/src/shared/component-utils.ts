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

export function clearUrlParam(param: string): string | null {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(param);

  if (value) {
    url.searchParams.delete(param);
    window.history.replaceState(null, "", url.toString());
  }

  return value;
}
