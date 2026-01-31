/**
 * Type map for parent component lookups.
 * Maps custom element tag names to their corresponding TypeScript types.
 */
type ParentComponentMap = {
  "u-profile": HTMLUProfileElement;
  "u-signin-root": HTMLUSigninRootElement;
  "u-signin-step": HTMLUSigninStepElement;
  "u-newsletter-root": HTMLUNewsletterRootElement;
  "u-ticketable-list": HTMLUTicketableListElement;
};

/**
 * Component context types used throughout the SDK.
 */
export type ComponentContext = "auth" | "profile" | "newsletter" | "ticketable";

// ============================================================================
// Parent Component Lookup Utilities
// ============================================================================

/**
 * Generic helper to find a parent component by tag name with proper typing.
 *
 * @param element - The element to start searching from
 * @param tagName - The tag name of the parent component to find
 * @returns The parent component element or null if not found
 *
 * @example
 * const profile = findParent(this.el, "u-profile");
 * profile?.submitProfile();
 */
export function findParent<T extends keyof ParentComponentMap>(element: HTMLElement, tagName: T): ParentComponentMap[T] | null {
  return element.closest(tagName) as ParentComponentMap[T] | null;
}

/**
 * Find the parent u-profile component.
 */
export function findParentProfile(element: HTMLElement): HTMLUProfileElement | null {
  return findParent(element, "u-profile");
}

/**
 * Find the parent u-signin-root component.
 */
export function findParentSigninRoot(element: HTMLElement): HTMLUSigninRootElement | null {
  return findParent(element, "u-signin-root");
}

/**
 * Find the parent u-signin-step component.
 */
export function findParentSigninStep(element: HTMLElement): HTMLUSigninStepElement | null {
  return findParent(element, "u-signin-step");
}

/**
 * Find the parent u-newsletter-root component.
 */
export function findParentNewsletterRoot(element: HTMLElement): HTMLUNewsletterRootElement | null {
  return findParent(element, "u-newsletter-root");
}

/**
 * Find the parent u-ticketable-list component.
 */
export function findParentTicketableList(element: HTMLElement): HTMLUTicketableListElement | null {
  return findParent(element, "u-ticketable-list");
}

// ============================================================================
// Context Detection Utilities
// ============================================================================

/**
 * Detects which component context an element is within.
 * Returns null if not within any known context.
 *
 * @param element - The element to detect context for
 * @returns The detected context or null
 *
 * @example
 * const context = detectContext(this.el);
 * if (context === "auth") { ... }
 */
export function detectContext(element: HTMLElement): ComponentContext | null {
  if (findParentSigninRoot(element) || findParentSigninStep(element)) {
    return "auth";
  }

  if (findParentProfile(element)) {
    return "profile";
  }

  if (findParentNewsletterRoot(element)) {
    return "newsletter";
  }

  if (findParentTicketableList(element)) {
    return "ticketable";
  }

  return null;
}

/**
 * Detects component context, throwing an error if not found.
 * Use this when the component requires being within a specific context.
 *
 * @param element - The element to detect context for
 * @param componentName - Name of the component for error message
 * @returns The detected context
 * @throws Error if no context is found
 *
 * @example
 * const context = detectContextOrThrow(this.el, "submit button");
 */
export function detectContextOrThrow(element: HTMLElement, componentName: string): ComponentContext {
  const context = detectContext(element);

  if (!context) {
    throw new Error(
      `No context found for ${componentName}. Make sure you are using the component within a u-signin-root, u-profile, u-newsletter-root, or u-ticketable-list.`,
    );
  }

  return context;
}
