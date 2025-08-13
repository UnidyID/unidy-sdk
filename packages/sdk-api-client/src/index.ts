import { ApiClient } from "./api_client";
import { NewsletterService } from "./newsletters";
import { ProfileService } from "./profile";

export * from "./api_client";
export * from "./newsletters";
export * from "./profile";

export class UnidyClient {
  private apiClient: ApiClient;

  newsletters: NewsletterService;
  profile: ProfileService;

  constructor(baseUrl: string, apiKey: string) {
    this.apiClient = new ApiClient(baseUrl, apiKey);
    this.newsletters = new NewsletterService(this.apiClient);
    this.profile = new ProfileService(this.apiClient);
  }
}
