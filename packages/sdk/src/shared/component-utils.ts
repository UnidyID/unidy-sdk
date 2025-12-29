/**
 * Checks if a Stencil component's slot has content.
 * Use this in components to render fallback content when a slot is empty.
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

export interface ThrottleOptions {
  thresholdMs?: number;
  onBlock?: (blocked: boolean) => void;
}

export function createThrottledHandler<T extends (...args: never[]) => Promise<void>>(handler: T, options: ThrottleOptions = {}): T {
  const { thresholdMs = 500, onBlock } = options;

  let lastCall = 0;
  let isExecuting = false;
  let blockTimer: ReturnType<typeof setTimeout> | null = null;

  return (async (...args: Parameters<T>) => {
    const now = Date.now();

    // Block if executing or within period defined by threshold
    if (isExecuting || now - lastCall < thresholdMs) {
      return;
    }

    if (blockTimer) {
      clearTimeout(blockTimer);
      blockTimer = null;
    }

    lastCall = now;
    isExecuting = true;
    onBlock?.(true);

    try {
      await handler(...args);
    } finally {
      isExecuting = false;

      const elapsed = Date.now() - lastCall;
      const remaining = thresholdMs - elapsed;

      if (remaining > 0) {
        blockTimer = setTimeout(() => {
          onBlock?.(false);
          blockTimer = null;
        }, remaining);
      } else {
        onBlock?.(false);
      }
    }
  }) as T;
}
