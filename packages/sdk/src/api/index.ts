import { ApiClient } from "./api_client";
import { AuthService } from "../auth/api/auth";
import { NewsletterService } from "../newsletter/api/newsletters";
import { ProfileService } from "../profile/api/profile";

export * from "./api_client";
export * from "../auth/api/auth";
export * from "../newsletter/api/newsletters";
export * from "../profile/api/profile";
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
