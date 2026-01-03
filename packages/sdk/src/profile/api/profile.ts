import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api";
import {
  ProfileErrorResponseSchema,
  UserProfileFormErrorSchema,
  UserProfileSchema,
  type FetchProfileArgs,
  type ProfileErrorResponse,
  type UpdateProfileArgs,
  type UserProfileData,
  type UserProfileFormError,
} from "./schemas";

// Re-export types and schemas for external use
export { UserProfileSchema } from "./schemas";
export type { UserProfileData, ProfileErrorResponse, UserProfileFormError } from "./schemas";

// Result types using tuples
export type ProfileGetResult =
  | CommonErrors
  | ["missing_id_token", null]
  | ["unauthorized", ProfileErrorResponse]
  | ["invalid_profile_data", null]
  | [null, UserProfileData];

export type ProfileUpdateResult =
  | CommonErrors
  | ["missing_id_token", null]
  | ["unauthorized", ProfileErrorResponse]
  | ["invalid_profile_data", null]
  | ["validation_error", UserProfileFormError]
  | [null, UserProfileData];

export class ProfileService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "ProfileService", deps);
  }

  async get({ idToken, lang }: FetchProfileArgs): Promise<ProfileGetResult> {
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const response = await this.client.get<unknown>(
      `/api/sdk/v1/profile${lang ? `?lang=${lang}` : ""}`,
      this.buildAuthHeaders({ "X-ID-Token": idToken }),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = ProfileErrorResponseSchema.safeParse(response.data);
        if (error.success) {
          if (response.status === 401) {
            return ["unauthorized", error.data];
          }
          throw new Error(`Unexpected error: ${error.data.error_identifier}`);
        }
        throw new Error("Failed to parse error response");
      }

      const parsed = UserProfileSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid profile data", parsed.error);
        return ["invalid_profile_data", null];
      }

      return [null, parsed.data];
    });
  }

  async update({ idToken, data, lang }: UpdateProfileArgs): Promise<ProfileUpdateResult> {
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const payload = data as object;

    const response = await this.client.patch<unknown>(
      `/api/sdk/v1/profile${lang ? `?lang=${lang}` : ""}`,
      { ...payload },
      this.buildAuthHeaders({ "X-ID-Token": idToken }),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        // Check for form validation errors first
        const formErrors = UserProfileFormErrorSchema.safeParse(response.data);
        if (formErrors.success) {
          return ["validation_error", formErrors.data];
        }

        // Check for API error response
        const error = ProfileErrorResponseSchema.safeParse(response.data);
        if (error.success) {
          if (response.status === 401) {
            return ["unauthorized", error.data];
          }
          throw new Error(`Unexpected error: ${error.data.error_identifier}`);
        }

        throw new Error("Failed to parse error response");
      }

      const parsed = UserProfileSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid profile data", parsed.error);
        return ["invalid_profile_data", null];
      }

      return [null, parsed.data];
    });
  }
}
