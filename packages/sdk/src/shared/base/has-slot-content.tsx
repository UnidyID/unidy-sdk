/**
 * Stencil mixin factory that adds slot content detection to a component.
 * Components using this mixin get `element` (host element) and `hasSlot` properties.
 * The slot content check is performed automatically in `connectedCallback`.
 */

import type { MixedInCtor } from "@stencil/core";

// biome-ignore lint/suspicious/noExplicitAny: Mixin factory requires any for Base parameter
export const HasSlotFactory = <B extends MixedInCtor>(Base: B = Object as any) => {
  function hasSlotContent(element: HTMLElement) {
    if (!element.hasChildNodes()) return false;

    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) return true;
      if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) return true;
    }

    return false;
  }

  class HasSlotMixin extends Base {
    // Provided by loggerFactory when used with UnidyComponent(HasSlotFactory)
    declare element: HTMLElement;
    hasSlot = false;

    /*
     * IMPORTANT: (for shadow: false components)
     * This must be called in `connectedCallback()` and cached.
     * After the first render, `element.childNodes` will contain both user-provided slot content
     * AND the component's rendered internal elements (like <button>), causing false positives.
     *
     * @see https://stenciljs.com/docs/templating-jsx#slots-outside-shadow-dom
     */
    connectedCallback() {
      this.hasSlot = hasSlotContent(this.element);
    }
  }

  return HasSlotMixin;
};
