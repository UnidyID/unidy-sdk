import * as z from "zod";
import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api";
import {
  CreateSubscriptionsPayloadSchema,
  CreateSubscriptionsResponseSchema,
  DeleteSubscriptionResponseSchema,
  LoginEmailPayloadSchema,
  NewsletterErrorResponseSchema,
  NewsletterSchema,
  NewsletterSubscriptionSchema,
  NewslettersResponseSchema,
  ResendDoiPayloadSchema,
  UpdateSubscriptionPayloadSchema,
  type CreateSubscriptionsPayload,
  type CreateSubscriptionsResponse,
  type LoginEmailPayload,
  type Newsletter,
  type NewsletterErrorResponse,
  type NewsletterSubscription,
  type NewslettersResponse,
  type ResendDoiPayload,
  type SubscriptionAuthOptions,
  type UpdateSubscriptionPayload,
} from "./schemas";

// Re-export types for external use
export type {
  NewsletterSubscription,
  NewsletterSubscriptionError,
  CreateSubscriptionsResponse,
  CreateSubscriptionsPayload,
  AdditionalFields,
  UpdateSubscriptionPayload,
  LoginEmailPayload,
  ResendDoiPayload,
  Newsletter,
  NewslettersResponse,
  Preference,
  PreferenceGroup,
  NewsletterErrorResponse,
  SubscriptionAuthOptions,
} from "./schemas";

// Result types using tuples - following AuthService pattern
export type NewsletterCreateResult =
  | CommonErrors
  | ["rate_limit_exceeded", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | ["newsletter_error", CreateSubscriptionsResponse]
  | [null, CreateSubscriptionsResponse];

export type NewsletterListResult = CommonErrors | ["unauthorized", NewsletterErrorResponse] | [null, NewsletterSubscription[]];

export type NewsletterGetResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | [null, NewsletterSubscription];

export type NewsletterUpdateResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | [null, NewsletterSubscription];

export type NewsletterDeleteResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | [null, { new_preference_token: string } | null];

export type NewsletterResendDoiResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | ["already_confirmed", NewsletterErrorResponse]
  | [null, null];

export type NewsletterSendLoginEmailResult = CommonErrors | ["rate_limit_exceeded", NewsletterErrorResponse] | [null, null];

export type NewsletterListAllResult = CommonErrors | [null, NewslettersResponse];

export type NewsletterGetByNameResult = CommonErrors | ["not_found", NewsletterErrorResponse] | [null, Newsletter];

export class NewsletterService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "NewsletterService", deps);
  }

  private buildSubscriptionAuthHeaders(auth?: SubscriptionAuthOptions): HeadersInit | undefined {
    if (!auth) return undefined;
    return this.buildAuthHeaders({
      "X-ID-Token": auth.idToken,
      "X-Preference-Token": auth.preferenceToken,
    });
  }

  /**
   * Create newsletter subscriptions for a user
   */
  async create(payload: CreateSubscriptionsPayload, auth?: SubscriptionAuthOptions): Promise<NewsletterCreateResult> {
    CreateSubscriptionsPayloadSchema.parse(payload);

    const response = await this.client.post<unknown>(
      "/api/sdk/v1/newsletters/newsletter_subscription",
      payload,
      this.buildSubscriptionAuthHeaders(auth),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = NewsletterErrorResponseSchema.parse(response.data);
        switch (response.status) {
          case 401:
            return ["unauthorized", error];
          case 429:
            this.logger.warn("Rate limit exceeded");
            return ["rate_limit_exceeded", error];
          case 500:
            this.errorReporter.captureException(response);
            return ["server_error", error];
          default:
            return ["server_error", error];
        }
      }

      const data = CreateSubscriptionsResponseSchema.parse(response.data);
      if (data.errors.length > 0) {
        return ["newsletter_error", data];
      }
      return [null, data];
    });
  }

  /**
   * List all subscriptions for the authenticated user
   */
  async list(auth: SubscriptionAuthOptions): Promise<NewsletterListResult> {
    const response = await this.client.get<unknown>(
      "/api/sdk/v1/newsletters/newsletter_subscription",
      this.buildSubscriptionAuthHeaders(auth),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = NewsletterErrorResponseSchema.parse(response.data);
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        throw new Error(`Unexpected error: ${error.error_identifier}`);
      }

      const data = z.array(NewsletterSubscriptionSchema).parse(response.data);
      return [null, data];
    });
  }

  /**
   * Get a specific subscription by newsletter internal name
   */
  async get(internalName: string, auth: SubscriptionAuthOptions): Promise<NewsletterGetResult> {
    const response = await this.client.get<unknown>(
      `/api/sdk/v1/newsletters/${internalName}/newsletter_subscription`,
      this.buildSubscriptionAuthHeaders(auth),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = NewsletterErrorResponseSchema.parse(response.data);
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        if (response.status === 404) {
          return ["not_found", error];
        }
        throw new Error(`Unexpected error: ${error.error_identifier}`);
      }

      const data = NewsletterSubscriptionSchema.parse(response.data);
      return [null, data];
    });
  }

  /**
   * Update a subscription's preferences
   */
  async update(internalName: string, payload: UpdateSubscriptionPayload, auth: SubscriptionAuthOptions): Promise<NewsletterUpdateResult> {
    UpdateSubscriptionPayloadSchema.parse(payload);

    const response = await this.client.patch<unknown>(
      `/api/sdk/v1/newsletters/${internalName}/newsletter_subscription`,
      payload,
      this.buildSubscriptionAuthHeaders(auth),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = NewsletterErrorResponseSchema.parse(response.data);
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        if (response.status === 404) {
          return ["not_found", error];
        }
        throw new Error(`Unexpected error: ${error.error_identifier}`);
      }

      const data = NewsletterSubscriptionSchema.parse(response.data);
      return [null, data];
    });
  }

  /**
   * Delete a subscription
   */
  async delete(internalName: string, auth: SubscriptionAuthOptions): Promise<NewsletterDeleteResult> {
    const response = await this.client.delete<unknown>(
      `/api/sdk/v1/newsletters/${internalName}/newsletter_subscription`,
      this.buildSubscriptionAuthHeaders(auth),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = NewsletterErrorResponseSchema.parse(response.data);
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        if (response.status === 404) {
          return ["not_found", error];
        }
        throw new Error(`Unexpected error: ${error.error_identifier}`);
      }

      const data = DeleteSubscriptionResponseSchema.parse(response.data);
      return [null, data];
    });
  }

  /**
   * Resend double opt-in confirmation email
   */
  async resendDoi(internalName: string, payload: ResendDoiPayload, auth: SubscriptionAuthOptions): Promise<NewsletterResendDoiResult> {
    ResendDoiPayloadSchema.parse(payload);

    const response = await this.client.post<unknown>(
      `/api/sdk/v1/newsletters/${internalName}/newsletter_subscription/resend_doi`,
      payload,
      this.buildSubscriptionAuthHeaders(auth),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = NewsletterErrorResponseSchema.parse(response.data);
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        if (response.status === 404) {
          return ["not_found", error];
        }
        if (error.error_identifier === "already_confirmed") {
          return ["already_confirmed", error];
        }
        throw new Error(`Unexpected error: ${error.error_identifier}`);
      }

      return [null, null];
    });
  }

  /**
   * Send a login email for newsletter management
   */
  async sendLoginEmail(payload: LoginEmailPayload): Promise<NewsletterSendLoginEmailResult> {
    LoginEmailPayloadSchema.parse(payload);

    const response = await this.client.post<unknown>("/api/sdk/v1/newsletters/newsletter_subscription/login_email", payload);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = NewsletterErrorResponseSchema.parse(response.data);
        if (response.status === 429) {
          return ["rate_limit_exceeded", error];
        }
        throw new Error(`Unexpected error: ${error.error_identifier}`);
      }

      return [null, null];
    });
  }

  /**
   * List all available newsletters
   */
  async listAll(): Promise<NewsletterListAllResult> {
    const response = await this.client.get<unknown>("/api/sdk/v1/newsletters");

    return this.handleResponse(response, () => {
      if (!response.success) {
        throw new Error("Failed to fetch newsletters");
      }

      const data = NewslettersResponseSchema.parse(response.data);
      return [null, data];
    });
  }

  /**
   * Get a newsletter by its internal name
   */
  async getByName(internalName: string): Promise<NewsletterGetByNameResult> {
    const response = await this.client.get<unknown>(`/api/sdk/v1/newsletters/${internalName}`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = NewsletterErrorResponseSchema.parse(response.data);
        if (response.status === 404) {
          return ["not_found", error];
        }
        throw new Error(`Unexpected error: ${error.error_identifier}`);
      }

      const data = NewsletterSchema.parse(response.data);
      return [null, data];
    });
  }
}
