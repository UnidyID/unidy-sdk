import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api/base-service";
import {
  type CheckConsentResponse,
  CheckConsentResponseSchema,
  type CheckConsentWithErrorResponse,
  CheckConsentWithErrorResponseSchema,
  type ConnectRequest,
  type GrantConsentRequest,
  OAuthErrorSchema,
  type OAuthTokenResponse,
  OAuthTokenResponseSchema,
  type UpdateConsentRequest,
} from "./schemas";

// Re-export types
export type {
  CheckConsentResponse,
  CheckConsentWithErrorResponse,
  ConnectRequest,
  GrantConsentRequest,
  OAuthApplication,
  OAuthScope,
  OAuthTokenResponse,
  UpdateConsentRequest,
} from "./schemas";

// Result types
export type CheckConsentResult = CommonErrors | ["application_not_found", { error_identifier: string }] | [null, CheckConsentResponse];

export type UpdateConsentResult =
  | CommonErrors
  | ["application_not_found", { error_identifier: string }]
  | ["invalid_user_updates", { error_identifier: string; error_details?: Record<string, unknown> }]
  | [null, CheckConsentResponse];

export type GrantConsentResult =
  | CommonErrors
  | ["application_not_found", { error_identifier: string }]
  | ["missing_required_fields", { error_identifier: string; error_details: { missing_fields: string[] } }]
  | [null, OAuthTokenResponse];

export type ConnectResult =
  | CommonErrors
  | ["application_not_found", { error_identifier: string }]
  | ["consent_not_granted", CheckConsentWithErrorResponse]
  | ["missing_required_fields", CheckConsentWithErrorResponse]
  | [null, OAuthTokenResponse];

export class OAuthService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "OAuthService", deps);
  }

  private parseErrorResponse(data: unknown): { error_identifier: string; error_details?: Record<string, unknown> } {
    const parsed = OAuthErrorSchema.safeParse(data);
    return parsed.success ? parsed.data : { error_identifier: "unknown_error" };
  }

  /**
   * Check consent status for an OAuth application.
   * Returns application info, consent status, and required/missing fields.
   */
  async checkConsent(clientId: string): Promise<CheckConsentResult> {
    const idToken = await this.getIdToken();
    const headers = this.buildAuthHeaders({ "X-ID-Token": idToken ?? undefined });

    const response = await this.client.get<CheckConsentResponse>(`/api/sdk/v1/oauth/${clientId}/consent`, headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = this.parseErrorResponse(response.data);
        return ["application_not_found", error];
      }

      return [null, CheckConsentResponseSchema.parse(response.data)];
    });
  }

  /**
   * Update user data and return consent status.
   * Used to fill in missing required fields before granting consent.
   */
  async updateConsent(clientId: string, request: UpdateConsentRequest): Promise<UpdateConsentResult> {
    const idToken = await this.getIdToken();
    const headers = this.buildAuthHeaders({ "X-ID-Token": idToken ?? undefined });

    const response = await this.client.patch<CheckConsentResponse>(`/api/sdk/v1/oauth/${clientId}/consent`, request, headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = this.parseErrorResponse(response.data);
        if (error.error_identifier === "invalid_user_updates") {
          return ["invalid_user_updates", error];
        }
        return ["application_not_found", error];
      }

      return [null, CheckConsentResponseSchema.parse(response.data)];
    });
  }

  /**
   * Grant consent for an OAuth application.
   * Returns a one-time login token for redirect.
   */
  async grantConsent(clientId: string, request?: GrantConsentRequest): Promise<GrantConsentResult> {
    const idToken = await this.getIdToken();
    const headers = this.buildAuthHeaders({ "X-ID-Token": idToken ?? undefined });

    const response = await this.client.post<OAuthTokenResponse>(`/api/sdk/v1/oauth/${clientId}/consent`, request ?? {}, headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = this.parseErrorResponse(response.data);
        if (error.error_identifier === "missing_required_fields") {
          return ["missing_required_fields", error as { error_identifier: string; error_details: { missing_fields: string[] } }];
        }
        return ["application_not_found", error];
      }

      return [null, OAuthTokenResponseSchema.parse(response.data)];
    });
  }

  /**
   * Connect to an OAuth application.
   * Returns a one-time login token if consent is granted and all fields are present.
   * Otherwise returns consent data with error information.
   */
  async connect(clientId: string, request?: ConnectRequest): Promise<ConnectResult> {
    const idToken = await this.getIdToken();
    const headers = this.buildAuthHeaders({ "X-ID-Token": idToken ?? undefined });

    const response = await this.client.post<OAuthTokenResponse | CheckConsentWithErrorResponse>(
      `/api/sdk/v1/oauth/${clientId}/connect`,
      request ?? {},
      headers,
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        // The connect endpoint returns consent data with error on failure
        const consentWithError = CheckConsentWithErrorResponseSchema.safeParse(response.data);
        if (consentWithError.success) {
          const errorId = consentWithError.data.error_identifier;
          if (errorId === "consent_not_granted") {
            return ["consent_not_granted", consentWithError.data];
          }
          if (errorId === "missing_required_fields") {
            return ["missing_required_fields", consentWithError.data];
          }
        }

        const error = this.parseErrorResponse(response.data);
        return ["application_not_found", { error_identifier: error.error_identifier }];
      }

      return [null, OAuthTokenResponseSchema.parse(response.data)];
    });
  }
}
