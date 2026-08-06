/**
 * Template-driven list rendering primitives shared by `u-ticketable-list` and
 * `u-transaction-list`. Both components render a user-supplied `<template>`,
 * substituting item values into a tag (`<ticketable-value>` / `<transaction-value>`),
 * toggling conditional blocks, and handling skeleton-loading states.
 *
 * The surface here is intentionally tag-agnostic so new list types can opt in by
 * providing a `RenderFragmentConfig` rather than duplicating ~300 lines.
 */
import type { Locale } from "date-fns";
import { format } from "date-fns/format";
import { t } from "../i18n";
import { createSkeletonLoader, replaceTextNodesWithSkeletons } from "./skeleton-helpers";
import { unidyState } from "./store/unidy-store";

/** Shared date-fns locale cache. Populated by `loadLocales()`. */
export const LOCALES: Record<string, Locale> = {};

interface LocaleWarnLogger {
  // biome-ignore lint/suspicious/noExplicitAny: matches SDK logger signature
  warn: (...args: any[]) => void;
}

/**
 * Populate `LOCALES` with the date-fns locales shipped with the SDK.
 * Idempotent — already-loaded locales are skipped.
 */
export async function loadLocales(logger?: LocaleWarnLogger): Promise<void> {
  try {
    await Promise.all([
      !LOCALES.cs &&
        import("date-fns/locale/cs").then((module) => {
          LOCALES.cs = module.cs;
        }),
      !LOCALES.de &&
        import("date-fns/locale/de").then((module) => {
          LOCALES.de = module.de;
        }),
      !LOCALES.en &&
        import("date-fns/locale/en-GB").then((module) => {
          LOCALES.en = module.enGB;
        }),
      !LOCALES.fr &&
        import("date-fns/locale/fr").then((module) => {
          LOCALES.fr = module.fr;
        }),
      !LOCALES.it &&
        import("date-fns/locale/it").then((module) => {
          LOCALES.it = module.it;
        }),
      !LOCALES.ka &&
        import("date-fns/locale/ka").then((module) => {
          LOCALES.ka = module.ka;
        }),
      !LOCALES.nl_be &&
        import("date-fns/locale/nl-BE").then((module) => {
          LOCALES.nl_be = module.nlBE;
        }),
      !LOCALES.ro &&
        import("date-fns/locale/ro").then((module) => {
          LOCALES.ro = module.ro;
        }),
      !LOCALES.nb &&
        import("date-fns/locale/nb").then((module) => {
          LOCALES.nb = module.nb;
        }),
      !LOCALES.sv &&
        import("date-fns/locale/sv").then((module) => {
          LOCALES.sv = module.sv;
        }),
    ]);
  } catch (err) {
    logger?.warn("Failed to load locales, falling back to 'en'", err);
  }
}

/**
 * Extracts a nested value from an object using a path string.
 * Supports dot notation for object properties and bracket notation for arrays.
 * Paths must use dot notation throughout, e.g., "metadata.foo.bar.[1]"
 * Examples:
 *   - "metadata.foo.bar" -> item.metadata.foo.bar
 *   - "metadata.foo.bar.[1]" -> item.metadata.foo.bar[1]
 *   - "line_items.[0].currency" -> item.line_items[0].currency
 */
// biome-ignore lint/suspicious/noExplicitAny: Dynamic nested property access requires any
export function getNestedValue(obj: any, path: string): any {
  if (!path || !obj) return undefined;

  const parts = path.split(".").filter(Boolean);
  let result = obj;

  for (const part of parts) {
    if (result == null) return undefined;

    if (part.startsWith("[") && part.endsWith("]")) {
      const indexStr = part.slice(1, -1);
      const index = /^\d+$/.test(indexStr) ? Number.parseInt(indexStr, 10) : indexStr;
      result = result[index];
    } else {
      result = result[part];
    }
  }

  if (typeof result === "object" && result != null && !(result instanceof Date)) {
    return JSON.stringify(result);
  }

  return result;
}

/**
 * Walks `path` against `obj` and returns the object that holds the terminal key.
 * Useful for resolving sibling fields (e.g. the `currency` adjacent to a `total`).
 * Returns `undefined` if the path can't be traversed.
 */
// biome-ignore lint/suspicious/noExplicitAny: Dynamic nested property access requires any
export function getParentOfNestedValue(obj: any, path: string): any {
  if (!path || !obj) return undefined;

  const parts = path.split(".").filter(Boolean);
  if (parts.length <= 1) return obj;

  let result = obj;
  for (const part of parts.slice(0, -1)) {
    if (result == null) return undefined;

    if (part.startsWith("[") && part.endsWith("]")) {
      const indexStr = part.slice(1, -1);
      const index = /^\d+$/.test(indexStr) ? Number.parseInt(indexStr, 10) : indexStr;
      result = result[index];
    } else {
      result = result[part];
    }
  }

  return result;
}

/** Shared i18n error-code → message mapping for list-fetch failures. */
export function translateListError(fallbackKey: string, fallbackDefault: string, error: string | null): string {
  if (!error) {
    return t(fallbackKey, { defaultValue: fallbackDefault });
  }

  const errorMessages: Record<string, string> = {
    connection_failed: t("errors.connection_failed", { defaultValue: "Connection failed. Please check your internet connection." }),
    schema_validation_error: t("errors.schema_validation", { defaultValue: "Invalid data received from server." }),
    internal_error: t("errors.internal", { defaultValue: "An internal error occurred." }),
    missing_id_token: t("errors.unauthorized", { defaultValue: "You must be logged in to view this content." }),
    unauthorized: t("errors.unauthorized", { defaultValue: "You are not authorized to view this content." }),
    server_error: t("errors.server", { defaultValue: "A server error occurred. Please try again later." }),
    invalid_response: t("errors.invalid_response", { defaultValue: "Invalid response from server." }),
  };

  return errorMessages[error] || t("errors.unknown", { defaultValue: "An unknown error occurred." });
}

/**
 * Config describing how a list component's template should be processed.
 * `valueTag` and `conditionalTag` are the two custom elements that `renderFragment`
 * walks; everything else lets the caller hook into numeric/currency formatting and
 * add component-specific post-processing (e.g. stamping data attrs on exports).
 */
export interface RenderFragmentConfig<T> {
  /** Name of the value substitution element, e.g. "ticketable-value". */
  valueTag: string;
  /** Name of the conditional element, e.g. "ticketable-conditional". */
  conditionalTag: string;
  /** Returns true when a numeric value at `key` should be formatted as a currency. */
  isCurrencyKey?: (key: string) => boolean;
  /** Returns the currency code to use when formatting. Defaults to "EUR". */
  resolveCurrency?: (item: T, key: string) => string | null | undefined;
  /** Called once per fragment after value/conditional processing for any custom DOM work. */
  postProcess?: (fragment: DocumentFragment, item: T | undefined, isSkeleton: boolean) => void;
  /** When true, text nodes outside `valueTag` get skeleton loaders during loading. */
  skeletonAllText?: boolean;
}

/**
 * Clones `template`, substitutes values from `item` (or skeleton placeholders if
 * `item` is undefined), and runs conditional/post-processing hooks from `config`.
 */
export function renderFragment<T>(template: HTMLTemplateElement, item: T | undefined, config: RenderFragmentConfig<T>): DocumentFragment {
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const isSkeleton = !item;

  // Substitute `unidy-attr-*` attributes with values interpolated from the item.
  for (const elem of fragment.querySelectorAll("[unidy-attr]")) {
    for (const [unidyAttr, newValue] of Array.from(elem.attributes)
      .filter((attr) => attr.name.startsWith("unidy-attr-"))
      .map((attr) => {
        if (isSkeleton) {
          return [attr, "#"] as const;
        }

        const templateRegex = /\{\{([^}]+)\}\}/g;
        const value = attr.value.replace(templateRegex, (match, path) => {
          const nestedValue = getNestedValue(item, path.trim());
          return nestedValue != null ? String(nestedValue) : match;
        });

        return [attr, value] as const;
      })) {
      elem.setAttribute(unidyAttr.name.replace("unidy-attr-", ""), newValue);
      elem.removeAttribute(unidyAttr.name);
    }
  }

  if (isSkeleton && config.skeletonAllText) {
    replaceTextNodesWithSkeletons(fragment, { skipInsideTags: [config.valueTag] });
  }

  for (const valueEl of fragment.querySelectorAll(config.valueTag)) {
    if (isSkeleton) {
      valueEl.innerHTML = createSkeletonLoader("Sample Text");
      continue;
    }

    const key = valueEl.getAttribute("name");
    if (!key) continue;

    const value = getNestedValue(item, key);
    const formatAttr = valueEl.getAttribute("format");
    const dateFormatAttr = valueEl.getAttribute("date-format");

    let finalValue: string;

    if (value instanceof Date) {
      finalValue = format(value, dateFormatAttr || "yyyy-MM-dd", { locale: LOCALES[unidyState.locale] || LOCALES.en });
    } else if (typeof value === "number" && config.isCurrencyKey?.(key)) {
      const currency = config.resolveCurrency?.(item as T, key) || "EUR";
      finalValue = new Intl.NumberFormat(unidyState.locale, { style: "currency", currency }).format(value);
    } else if (typeof value === "number") {
      finalValue = Number.isInteger(value) ? value.toString() : value.toFixed(2);
    } else if (value != null) {
      finalValue = String(value);
    } else {
      finalValue = valueEl.getAttribute("default") || "";
    }

    if (formatAttr) {
      finalValue = formatAttr.replaceAll("{{value}}", finalValue);
    }

    valueEl.textContent = finalValue;
  }

  // Resolve conditionals: keep the element's children if `when` is truthy, drop otherwise.
  // Array copy is required because we mutate the DOM we're iterating.
  for (const conditionalEl of Array.from(fragment.querySelectorAll(config.conditionalTag))) {
    const whenAttr = conditionalEl.getAttribute("when");
    if (!whenAttr || isSkeleton) {
      conditionalEl.remove();
      continue;
    }

    const isTruthy = Boolean(getNestedValue(item, whenAttr));

    if (isTruthy) {
      const parent = conditionalEl.parentNode;
      if (parent) {
        while (conditionalEl.firstChild) {
          parent.insertBefore(conditionalEl.firstChild, conditionalEl);
        }
        parent.removeChild(conditionalEl);
      }
    } else {
      conditionalEl.remove();
    }
  }

  config.postProcess?.(fragment, item, isSkeleton);

  return fragment;
}

export interface RenderListContentArgs<T> {
  target: Element;
  template: HTMLTemplateElement;
  loading: boolean;
  error: string | null;
  items: T[];
  skeletonCount: number;
  config: RenderFragmentConfig<T>;
}

/**
 * Populates `target` with skeleton placeholders, rendered items, or an error
 * banner — whichever matches the current (loading / error / loaded) state.
 */
export function renderListContent<T>({ target, template, loading, error, items, skeletonCount, config }: RenderListContentArgs<T>): void {
  if (loading) {
    for (const _item of Array.from({ length: skeletonCount })) {
      target.appendChild(renderFragment(template, undefined, config));
    }
  } else if (!error) {
    for (const item of items) {
      target.appendChild(renderFragment(template, item, config));
    }
  } else {
    target.innerHTML = `<h1>${t("errors.prefix")} ${error}</h1>`;
  }
}
