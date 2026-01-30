import * as Sentry from "@sentry/browser";
import { unidyState } from "../shared/store/unidy-store";
import { BaseApiClient } from "./base-client";

// Re-export types from base-client for backwards compatibility
export type { ApiClientConfig, ApiResponse, QueryParams } from "./base-client";

/**
 * Browser-specific API client with CORS mode and Sentry error reporting.
 */
export class ApiClient extends BaseApiClient {
  constructor(baseUrl: string, apiKey: string, onConnectionChange?: (isConnected: boolean) => void) {
    super({ baseUrl, apiKey, onConnectionChange });
  }

  protected setConnectionStatus(isConnected: boolean): void {
    super.setConnectionStatus(isConnected);
    unidyState.backendConnected = isConnected;
  }

  protected getRequestOptions(): RequestInit {
    return {
      mode: "cors",
      credentials: "include",
    };
  }

  protected handleConnectionError(error: unknown, endpoint: string, method: string): void {
    Sentry.captureException(error, {
      tags: { error_type: "connection_error" },
      extra: { endpoint, method },
    });
  }
}
