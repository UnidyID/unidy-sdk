import type { ApiResponse } from "../../api/base-client";
import type { CommonErrors } from "../../api/base-service";

// Re-export for submodules
export type { CommonErrors } from "../../api/base-service";

/**
 * Type for the handleResponse function from BaseService.
 * Standalone API functions receive this as a dependency from AuthService.
 */
export type HandleResponseFn = <T>(
  response: ApiResponse<unknown>,
  handler: () => T,
) => T | CommonErrors;

/**
 * Builds an endpoint path with optional rid query parameter.
 * Uses URL API to safely handle existing query parameters.
 */
export function withRid(baseUrl: string, path: string, rid?: string): string {
  const url = new URL(path, baseUrl);
  if (rid) {
    url.searchParams.set("rid", rid);
  }
  return url.pathname + url.search;
}
