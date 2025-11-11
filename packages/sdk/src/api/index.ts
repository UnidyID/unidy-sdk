import { ApiClient } from "./api_client";
import { NewsletterService } from "../newsletter/api/newsletters";
import { ProfileService } from "../profile/api/profile";
import { AuthService } from "../auth/api/auth";
//import { NewsletterService } from "@unidy.io/sdk-api-client/src/newsletters";
//import { ProfileService } from "@unidy.io/sdk-api-client/src/profile";
//import { AuthService } from "@unidy.io/sdk-api-client/src/auth";

export * from "./api_client";
export * from "../newsletter/api/newsletters"
//export * from "@unidy.io/sdk-api-client/src/newsletters";
export * from "../profile/api/profile"
// export * from "@unidy.io/sdk-api-client/src/profile";
export * from "../auth/api/auth"
//export * from "@unidy.io/sdk-api-client/src/auth";
export * from "./shared"
//export * from "./src/shared";

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
