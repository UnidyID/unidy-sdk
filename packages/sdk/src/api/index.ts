import * as Sentry from "@sentry/browser";
import { AuthService } from "../auth/api/auth";
import { Auth } from "../auth/auth";
import { createLogger } from "../logger";
import { NewsletterService } from "../newsletter";
import { ProfileService } from "../profile";
import { unidyState } from "../shared/store/unidy-store";
import { SubscriptionsService, TicketsService } from "../ticketable";
import type { ServiceDependencies } from "./base-service";
import { ApiClient, ApiResponse } from "./client";

export * from "../auth/api/auth";
export * from "../newsletter/api/newsletters";
export * from "../profile/api/profile";
export * from "../ticketable/api/subscriptions";
export * from "../ticketable/api/tickets";
export * from "./base-service";
export * from "./shared";
export type { StandaloneUnidyClientConfig } from "./standalone";
export { createStandaloneClient, StandaloneApiClient, StandaloneUnidyClient } from "./standalone";

/** Default browser dependencies using Sentry and the SDK logger */
function createBrowserDeps(serviceName: string): ServiceDependencies {
  return {
    logger: createLogger(serviceName),
    errorReporter: {
      captureException: (error, context) => Sentry.captureException(error, { extra: context }),
    },
    getIdToken: async () => {
      const auth = await Auth.getInstance();
      const token = await auth.getToken();
      return typeof token === "string" ? token : null;
    },
    getLocale: () => unidyState.locale,
  };
}

export class UnidyClient {
  private apiClient: ApiClient;

  newsletters: NewsletterService;
  profile: ProfileService;
  auth: AuthService;
  tickets: TicketsService;
  subscriptions: SubscriptionsService;

  constructor(baseUrl: string, apiKey: string) {
    this.apiClient = new ApiClient(baseUrl, apiKey);

    // Initialize services with browser-specific dependencies
    this.newsletters = new NewsletterService(this.apiClient, createBrowserDeps("NewsletterService"));
    this.profile = new ProfileService(this.apiClient, createBrowserDeps("ProfileService"));
    this.auth = new AuthService(this.apiClient, createBrowserDeps("AuthService"));
    this.tickets = new TicketsService(this.apiClient, createBrowserDeps("TicketsService"));
    this.subscriptions = new SubscriptionsService(this.apiClient, createBrowserDeps("SubscriptionsService"));
  }
}

let instance: UnidyClient | null = null;

function getUnidyClient(): UnidyClient {
  if (!unidyState.isConfigured) {
    throw new Error(
      "Config not initialized. Ensure <u-config> is loaded before making API calls by using waitForConfig() to wait for initialization.",
    );
  }

  if (!instance) {
    instance = new UnidyClient(unidyState.baseUrl, unidyState.apiKey);
  }

  return instance;
}

export { getUnidyClient, ApiClient, ApiResponse };
