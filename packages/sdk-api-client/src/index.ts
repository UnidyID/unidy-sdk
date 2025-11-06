import { ApiClient } from "./api_client";
import { NewsletterService } from "./newsletters";
import { ProfileService } from "./profile";
import { AuthService } from "./auth";

export * from "./api_client";
export * from "./newsletters";
export * from "./profile";
export * from "./auth";
export * from "./shared";

export class UnidyClient {
  private apiClient: ApiClient;

  newsletters: NewsletterService;
  profile: ProfileService;
  auth: AuthService;

  constructor(baseUrl: string, apiKey: string) {
    this.apiClient = new ApiClient(baseUrl, apiKey);
    this.newsletters = new NewsletterService(this.apiClient);
    this.profile = new ProfileService(this.apiClient);
    this.auth = new AuthService(this.apiClient);
  }
}
