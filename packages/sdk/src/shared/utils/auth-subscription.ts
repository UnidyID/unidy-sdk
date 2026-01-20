import { forceUpdate } from "@stencil/core";
import { onChange } from "../../auth/store/auth-store";

/**
 * Creates an auth state subscription that triggers component re-render on auth changes.
 * Call in connectedCallback, store the return value, and call it in disconnectedCallback.
 *
 * @example
 * ```tsx
 * private unsubscribe?: () => void;
 *
 * connectedCallback() {
 *   this.unsubscribe = createAuthSubscription(this);
 * }
 *
 * disconnectedCallback() {
 *   this.unsubscribe?.();
 * }
 * ```
 */
export function createAuthSubscription(component: unknown): () => void {
  return onChange("authenticated", () => {
    forceUpdate(component);
  });
}
