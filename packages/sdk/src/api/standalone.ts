import { AuthService } from "../auth/api/auth";
import { NewsletterService } from "../newsletter/api/newsletters";
import { ProfileService } from "../profile/api/profile";
import { TicketsService } from "../ticketable/api/tickets";
import { SubscriptionsService } from "../ticketable/api/subscriptions";
import { BaseApiClient } from "./base-client";
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
export type { ApiResponse, ApiClientConfig, QueryParams } from "./base-client";

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
export class StandaloneApiClient extends BaseApiClient {
  protected getRequestOptions(): RequestInit {
    // No browser-specific options for standalone client
    return {};
  }

  protected handleConnectionError(_error: unknown, _endpoint: string, _method: string): void {
    // No-op for standalone client - users can inject their own error reporter via ServiceDependencies
  }
}

import type { ApiClientConfig } from "./base-client";

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
export interface StandaloneUnidyClientConfig extends ApiClientConfig {
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
