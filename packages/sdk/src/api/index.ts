import { ApiClient } from "./api_client";
import { AuthService } from "../auth/api/auth";
import { NewsletterService } from "../newsletter";
import { ProfileService } from "../profile";
import { unidyState } from "../shared/store/unidy-store";
import { SubscriptionsService, TicketsService } from "../ticketable";

export * from "./api_client";
export * from "../auth/api/auth";
export * from "../newsletter/api/newsletters";
export * from "../profile/api/profile";
export * from "./shared";
export * from "../ticketable/api/subscriptions";
export * from "../ticketable/api/tickets";

export class UnidyClient {
  private apiClient: ApiClient;

  newsletters: NewsletterService;
  profile: ProfileService;
  auth: AuthService;
  tickets: TicketsService;
  subscriptions: SubscriptionsService;

  constructor(baseUrl: string, apiKey: string) {
    this.apiClient = new ApiClient(baseUrl, apiKey, (isConnected) => {
      unidyState.backendConnected = isConnected;
    });

    this.newsletters = new NewsletterService(this.apiClient);
    this.profile = new ProfileService(this.apiClient);
    this.auth = new AuthService(this.apiClient);
    this.tickets = new TicketsService(this.apiClient);
    this.subscriptions = new SubscriptionsService(this.apiClient);
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

export { getUnidyClient };
