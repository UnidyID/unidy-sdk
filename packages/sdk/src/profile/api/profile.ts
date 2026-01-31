import type { ApiResponse } from "../../api/base-client";
import { type ApiClientInterface, BaseService, type CommonErrors, type Payload, type ServiceDependencies } from "../../api/base-service";
import {
  type ProfileErrorResponse,
  ProfileErrorResponseSchema,
  type UserProfileData,
  type UserProfileFormError,
  UserProfileFormErrorSchema,
  UserProfileRailsFormErrorSchema,
  UserProfileSchema,
} from "./schemas";

export type { ProfileErrorResponse, UserProfileData, UserProfileFormError } from "./schemas";
// Re-export types and schemas for external use
export { UserProfileSchema } from "./schemas";

// Payload type for update (flexible object)
export type UpdateProfilePayload = Record<string, unknown>;

// Argument types for unified interface
export type ProfileUpdateArgs = Payload<UpdateProfilePayload>;

// Response info type for error diagnostics
export type ResponseInfo = {
  httpStatus?: number;
  responseData?: unknown;
};

// Result types using tuples - 3rd element is optional response info for error diagnostics
export type ProfileGetResult =
  | [...CommonErrors, ResponseInfo?]
  | ["missing_id_token", null, ResponseInfo?]
  | ["unauthorized", ProfileErrorResponse, ResponseInfo?]
  | ["invalid_profile_data", null, ResponseInfo?]
  | ["server_error", ProfileErrorResponse | null, ResponseInfo?]
  | [null, UserProfileData, ResponseInfo?];

export type ProfileUpdateResult =
  | [...CommonErrors, ResponseInfo?]
  | ["missing_id_token", null, ResponseInfo?]
  | ["unauthorized", ProfileErrorResponse, ResponseInfo?]
  | ["invalid_profile_data", null, ResponseInfo?]
  | ["validation_error", UserProfileFormError, ResponseInfo?]
  | ["server_error", ProfileErrorResponse | null, ResponseInfo?]
  | [null, UserProfileData, ResponseInfo?];

export class ProfileService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "ProfileService", deps);
  }

  /** Build response info for error diagnostics */
  private buildResponseInfo(response: ApiResponse<unknown>): ResponseInfo {
    return {
      httpStatus: response.status,
      responseData: response.data,
    };
  }

  async get(): Promise<ProfileGetResult> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const lang = this.getLocale();
    const response = await this.client.get<unknown>(
      `/api/sdk/v1/profile${lang ? `?lang=${lang}` : ""}`,
      this.buildAuthHeaders({ "X-ID-Token": idToken }),
    );

    const responseInfo = this.buildResponseInfo(response);

    const result = this.handleResponse(response, (): ProfileGetResult => {
      if (!response.success) {
        const error = ProfileErrorResponseSchema.safeParse(response.data);
        if (error.success) {
          if (response.status === 401) {
            return ["unauthorized", error.data, responseInfo];
          }
          return ["server_error", error.data, responseInfo];
        }
        return ["server_error", null, responseInfo];
      }

      const parsed = UserProfileSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid profile data", parsed.error);
        return ["invalid_profile_data", null, responseInfo];
      }

      return [null, parsed.data, responseInfo];
    });

    // If handleResponse returned a common error (connection_failed, etc), add response info
    if (Array.isArray(result) && result.length === 2) {
      return [...result, responseInfo] as ProfileGetResult;
    }
    return result;
  }

  async update(args: ProfileUpdateArgs): Promise<ProfileUpdateResult> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const { payload } = args;
    const lang = this.getLocale();

    const response = await this.client.patch<unknown>(
      `/api/sdk/v1/profile${lang ? `?lang=${lang}` : ""}`,
      { ...payload },
      this.buildAuthHeaders({ "X-ID-Token": idToken }),
    );

    const responseInfo = this.buildResponseInfo(response);

    const result = this.handleResponse(response, (): ProfileUpdateResult => {
      if (!response.success) {
        // Check for form validation errors first (standard format: { errors: {...} })
        const formErrors = UserProfileFormErrorSchema.safeParse(response.data);
        if (formErrors.success) {
          return ["validation_error", formErrors.data, responseInfo];
        }

        // Check for Rails-style form errors (format: { error_details: {...} })
        const railsFormErrors = UserProfileRailsFormErrorSchema.safeParse(response.data);
        if (railsFormErrors.success) {
          return ["validation_error", railsFormErrors.data, responseInfo];
        }

        // Check for API error response
        const error = ProfileErrorResponseSchema.safeParse(response.data);
        if (error.success) {
          if (response.status === 401) {
            return ["unauthorized", error.data, responseInfo];
          }
          return ["server_error", error.data, responseInfo];
        }

        return ["server_error", null, responseInfo];
      }

      const parsed = UserProfileSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid profile data", parsed.error);
        return ["invalid_profile_data", null, responseInfo];
      }

      return [null, parsed.data, responseInfo];
    });

    // If handleResponse returned a common error (connection_failed, etc), add response info
    if (Array.isArray(result) && result.length === 2) {
      return [...result, responseInfo] as ProfileUpdateResult;
    }
    return result;
  }
}
