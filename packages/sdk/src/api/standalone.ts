import { AuthService } from "../auth/api/auth";
import { NewsletterService } from "../newsletter/api/newsletters";
import { ProfileService } from "../profile/api/profile";
import { TicketsService } from "../ticketable/api/tickets";
import { SubscriptionsService } from "../ticketable/api/subscriptions";
import type { ServiceDependencies } from "./base-service";

/**
 * Standalone API client and services for use outside of Stencil components.
 * This module can be used in Node.js or any other JavaScript environment.
 *
 * @example
 * ```typescript
 * import {
 *   StandaloneApiClient,
 *   AuthService,
 *   NewsletterService,
 * } from '@unidy.io/sdk/standalone';
 *
 * // Create the API client
 * const client = new StandaloneApiClient({
 *   baseUrl: 'https://api.unidy.io',
 *   apiKey: 'your-api-key',
 * });
 *
 * // Create services with optional custom logger/error reporter
 * const auth = new AuthService(client, {
 *   logger: console,
 *   errorReporter: { captureException: (e) => myErrorTracker.capture(e) },
 * });
 *
 * // Use the services
 * const result = await auth.createSignIn({ payload: { email: 'user@example.com' } });
 * ```
 */

// Re-export service classes
export { AuthService } from "../auth/api/auth";
export { NewsletterService } from "../newsletter/api/newsletters";
export { ProfileService } from "../profile/api/profile";
export { TicketsService } from "../ticketable/api/tickets";
export { SubscriptionsService } from "../ticketable/api/subscriptions";

// Re-export types
export type * from "../auth/api/auth";
export type * from "../newsletter/api/newsletters";
export type * from "../profile/api/profile";
export type * from "../ticketable/api/tickets";
export type * from "../ticketable/api/subscriptions";
export type { SchemaValidationError, PaginationMeta, PaginationParams } from "./shared";
export type {
  CommonErrors,
  ServiceResult,
  Logger,
  ErrorReporter,
  ServiceDependencies,
  ApiClientInterface,
} from "./base-service";

/**
 * Configuration options for the standalone API client
 */
export interface StandaloneClientConfig {
  baseUrl: string;
  apiKey: string;
  /** Optional callback when connection status changes */
  onConnectionChange?: (isConnected: boolean) => void;
}

/**
 * API Response type
 */
export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  status: number;
  headers: Headers;
  error?: Error | string;
  connectionError?: boolean;
}

/**
 * Standalone API client without browser-specific dependencies.
 *
 * This client provides the same interface as the browser ApiClient but without
 * dependencies on Sentry, i18n, localStorage, or other browser APIs.
 *
 * @example
 * ```typescript
 * import { StandaloneApiClient, AuthService } from '@unidy.io/sdk/standalone';
 *
 * const client = new StandaloneApiClient({
 *   baseUrl: 'https://api.unidy.io',
 *   apiKey: 'your-api-key',
 * });
 *
 * const auth = new AuthService(client);
 * const result = await auth.createSignIn({ payload: { email: 'user@example.com' } });
 * ```
 */
export class StandaloneApiClient {
  private static readonly CONNECTION_ERROR_MESSAGES = [
    "Failed to fetch",
    "NetworkError",
    "ERR_CONNECTION_REFUSED",
    "ERR_NETWORK",
    "ERR_INTERNET_DISCONNECTED",
    "ECONNREFUSED",
    "ENOTFOUND",
    "EAI_AGAIN",
  ];

  private onConnectionChange?: (isConnected: boolean) => void;

  public baseUrl: string;
  public api_key: string;

  constructor(config: StandaloneClientConfig) {
    this.baseUrl = config.baseUrl;
    this.api_key = config.apiKey;
    this.onConnectionChange = config.onConnectionChange;
  }

  private isConnectionError(error: unknown): boolean {
    if (error instanceof Error) {
      return StandaloneApiClient.CONNECTION_ERROR_MESSAGES.some((msg) => error.message.includes(msg));
    }
    return false;
  }

  private setConnectionStatus(isConnected: boolean) {
    if (this.onConnectionChange) {
      this.onConnectionChange(isConnected);
    }
  }

  private baseHeaders(): Headers {
    const h = new Headers();
    h.set("Content-Type", "application/json");
    h.set("Accept", "application/json");
    h.set("Authorization", `Bearer ${this.api_key}`);
    return h;
  }

  private mergeHeaders(base: Headers, extra?: HeadersInit): Headers {
    const out = new Headers(base);
    if (extra) {
      new Headers(extra).forEach((v, k) => {
        out.set(k, v);
      });
    }
    return out;
  }

  private async request<T>(method: string, endpoint: string, body?: object, headers?: HeadersInit): Promise<ApiResponse<T>> {
    let res: Response | null = null;
    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: this.mergeHeaders(this.baseHeaders(), headers),
        body: body ? JSON.stringify(body) : undefined,
      });

      let data: T | undefined;
      try {
        data = await res.json();
      } catch {
        data = undefined;
      }

      this.setConnectionStatus(true);

      return {
        data,
        status: res.status,
        headers: res.headers,
        success: res.ok,
        connectionError: false,
      };
    } catch (error) {
      const connectionFailed = this.isConnectionError(error);

      if (connectionFailed) {
        this.setConnectionStatus(false);
      }

      return {
        status: res ? res.status : connectionFailed ? 0 : 500,
        error: error instanceof Error ? error.message : String(error),
        headers: res ? res.headers : new Headers(),
        success: false,
        data: undefined,
        connectionError: connectionFailed,
      };
    }
  }

  async get<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, headers);
  }

  async post<T>(endpoint: string, body: object, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, body, headers);
  }

  async patch<T>(endpoint: string, body: object, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, body, headers);
  }

  async delete<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, headers);
  }
}

/**
 * Creates a standalone Unidy client with all services for use outside of Stencil.
 *
 * @example
 * ```typescript
 * import { createStandaloneClient } from '@unidy.io/sdk/standalone';
 *
 * const client = createStandaloneClient({
 *   baseUrl: 'https://api.unidy.io',
 *   apiKey: 'your-api-key',
 *   // Optional: inject custom dependencies
 *   deps: {
 *     logger: myLogger,
 *     errorReporter: { captureException: (e) => Sentry.captureException(e) },
 *   },
 * });
 *
 * const signIn = await client.auth.createSignIn({ payload: { email: 'user@example.com' } });
 * ```
 */
export interface StandaloneUnidyClientConfig extends StandaloneClientConfig {
  /** Optional dependencies to inject into all services */
  deps?: ServiceDependencies;
}

export class StandaloneUnidyClient {
  public auth: AuthService;
  public newsletters: NewsletterService;
  public profile: ProfileService;
  public tickets: TicketsService;
  public subscriptions: SubscriptionsService;

  constructor(config: StandaloneUnidyClientConfig) {
    const apiClient = new StandaloneApiClient(config);
    const deps = config.deps;

    this.auth = new AuthService(apiClient, deps);
    this.newsletters = new NewsletterService(apiClient, deps);
    this.profile = new ProfileService(apiClient, deps);
    this.tickets = new TicketsService(apiClient, deps);
    this.subscriptions = new SubscriptionsService(apiClient, deps);
  }
}

export function createStandaloneClient(config: StandaloneUnidyClientConfig): StandaloneUnidyClient {
  return new StandaloneUnidyClient(config);
}
