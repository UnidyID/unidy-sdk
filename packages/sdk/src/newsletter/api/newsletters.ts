import * as z from "zod";
import {
  type ApiClientInterface,
  BaseService,
  type CommonErrors,
  type Options,
  type Payload,
  type ServiceDependencies,
} from "../../api/base-service";
import {
  type CreateSubscriptionsPayload,
  CreateSubscriptionsPayloadSchema,
  type CreateSubscriptionsResponse,
  CreateSubscriptionsResponseSchema,
  DeleteSubscriptionResponseSchema,
  type LoginEmailPayload,
  LoginEmailPayloadSchema,
  type Newsletter,
  type NewsletterErrorResponse,
  NewsletterErrorResponseSchema,
  NewsletterSchema,
  type NewsletterSubscription,
  NewsletterSubscriptionSchema,
  type NewslettersResponse,
  NewslettersResponseSchema,
  type ResendDoiPayload,
  ResendDoiPayloadSchema,
  type UpdateSubscriptionPayload,
  UpdateSubscriptionPayloadSchema,
} from "./schemas";

// Re-export types for external use
export type {
  AdditionalFields,
  CreateSubscriptionsPayload,
  CreateSubscriptionsResponse,
  LoginEmailPayload,
  Newsletter,
  NewsletterErrorResponse,
  NewsletterSubscription,
  NewsletterSubscriptionError,
  NewslettersResponse,
  Preference,
  PreferenceGroup,
  ResendDoiPayload,
  UpdateSubscriptionPayload,
} from "./schemas";

// Options type for newsletter methods (only preferenceToken can be passed per-call)
export type NewsletterOptions = { preferenceToken: string };

// Argument types for unified interface
export type NewsletterCreateArgs = Payload<CreateSubscriptionsPayload> & Options<NewsletterOptions>;
export type NewsletterListArgs = Options<NewsletterOptions>;
export type NewsletterGetArgs = { internalName: string } & Options<NewsletterOptions>;
export type NewsletterUpdateArgs = { internalName: string } & Payload<UpdateSubscriptionPayload> & Options<NewsletterOptions>;
export type NewsletterDeleteArgs = { internalName: string } & Options<NewsletterOptions>;
export type NewsletterResendDoiArgs = { internalName: string } & Payload<ResendDoiPayload> & Options<NewsletterOptions>;
export type NewsletterSendLoginEmailArgs = Payload<LoginEmailPayload>;
export type NewsletterGetByNameArgs = { internalName: string };

// Result types using tuples
export type NewsletterCreateResult =
  | CommonErrors
  | ["rate_limit_exceeded", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | ["newsletter_error", CreateSubscriptionsResponse]
  | [null, CreateSubscriptionsResponse];

export type NewsletterListResult =
  | CommonErrors
  | ["unauthorized", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | [null, NewsletterSubscription[]];

export type NewsletterGetResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | [null, NewsletterSubscription];

export type NewsletterUpdateResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | [null, NewsletterSubscription];

export type NewsletterDeleteResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | [null, { new_preference_token: string } | null];

export type NewsletterResendDoiResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | ["already_confirmed", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | [null, null];

export type NewsletterSendLoginEmailResult =
  | CommonErrors
  | ["rate_limit_exceeded", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | [null, null];

export type NewsletterListAllResult = CommonErrors | ["server_error", null] | [null, NewslettersResponse];

export type NewsletterGetByNameResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | [null, Newsletter];

export class NewsletterService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "NewsletterService", deps);
  }

  private async buildNewsletterAuthHeaders(options?: Partial<NewsletterOptions>): Promise<HeadersInit | undefined> {
    const idToken = await this.getIdToken();
    return this.buildAuthHeaders({
      "X-ID-Token": idToken ?? undefined,
      "X-Preference-Token": options?.preferenceToken,
    });
  }

  /**
   * Create newsletter subscriptions for a user
   */
  async create(args: NewsletterCreateArgs): Promise<NewsletterCreateResult> {
    const { payload, options } = args;
    CreateSubscriptionsPayloadSchema.parse(payload);

    const headers = await this.buildNewsletterAuthHeaders(options);
    const response = await this.client.post<unknown>("/api/sdk/v1/newsletters/newsletter_subscription", payload, headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const parsed = NewsletterErrorResponseSchema.safeParse(response.data);
        const error = parsed.success ? parsed.data : { error_identifier: "unknown_error" };
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
  async list(args?: NewsletterListArgs): Promise<NewsletterListResult> {
    const headers = await this.buildNewsletterAuthHeaders(args?.options);
    const response = await this.client.get<unknown>("/api/sdk/v1/newsletters/newsletter_subscription", headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const parsed = NewsletterErrorResponseSchema.safeParse(response.data);
        const error = parsed.success ? parsed.data : { error_identifier: "unknown_error" };
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        return ["server_error", error];
      }

      const data = z.array(NewsletterSubscriptionSchema).parse(response.data);
      return [null, data];
    });
  }

  /**
   * Get a specific subscription by newsletter internal name
   */
  async get(args: NewsletterGetArgs): Promise<NewsletterGetResult> {
    const { internalName, options } = args;
    const headers = await this.buildNewsletterAuthHeaders(options);
    const response = await this.client.get<unknown>(`/api/sdk/v1/newsletters/${internalName}/newsletter_subscription`, headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const parsed = NewsletterErrorResponseSchema.safeParse(response.data);
        const error = parsed.success ? parsed.data : { error_identifier: "unknown_error" };
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        if (response.status === 404) {
          return ["not_found", error];
        }
        return ["server_error", error];
      }

      const data = NewsletterSubscriptionSchema.parse(response.data);
      return [null, data];
    });
  }

  /**
   * Update a subscription's preferences
   */
  async update(args: NewsletterUpdateArgs): Promise<NewsletterUpdateResult> {
    const { internalName, payload, options } = args;
    UpdateSubscriptionPayloadSchema.parse(payload);

    const headers = await this.buildNewsletterAuthHeaders(options);
    const response = await this.client.patch<unknown>(`/api/sdk/v1/newsletters/${internalName}/newsletter_subscription`, payload, headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const parsed = NewsletterErrorResponseSchema.safeParse(response.data);
        const error = parsed.success ? parsed.data : { error_identifier: "unknown_error" };
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        if (response.status === 404) {
          return ["not_found", error];
        }
        return ["server_error", error];
      }

      const data = NewsletterSubscriptionSchema.parse(response.data);
      return [null, data];
    });
  }

  /**
   * Delete a subscription
   */
  async delete(args: NewsletterDeleteArgs): Promise<NewsletterDeleteResult> {
    const { internalName, options } = args;
    const headers = await this.buildNewsletterAuthHeaders(options);
    const response = await this.client.delete<unknown>(`/api/sdk/v1/newsletters/${internalName}/newsletter_subscription`, headers);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const parsed = NewsletterErrorResponseSchema.safeParse(response.data);
        const error = parsed.success ? parsed.data : { error_identifier: "unknown_error" };
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        if (response.status === 404) {
          return ["not_found", error];
        }
        return ["server_error", error];
      }

      if(response.status === 204) {
        return [null, null];
      }

      const data = DeleteSubscriptionResponseSchema.parse(response.data);
      return [null, data];
    });
  }

  /**
   * Resend double opt-in confirmation email
   */
  async resendDoi(args: NewsletterResendDoiArgs): Promise<NewsletterResendDoiResult> {
    const { internalName, payload, options } = args;
    ResendDoiPayloadSchema.parse(payload);

    const headers = await this.buildNewsletterAuthHeaders(options);
    const response = await this.client.post<unknown>(
      `/api/sdk/v1/newsletters/${internalName}/newsletter_subscription/resend_doi`,
      payload,
      headers,
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const parsed = NewsletterErrorResponseSchema.safeParse(response.data);
        const error = parsed.success ? parsed.data : { error_identifier: "unknown_error" };
        if (response.status === 401) {
          return ["unauthorized", error];
        }
        if (response.status === 404) {
          return ["not_found", error];
        }
        if (error.error_identifier === "already_confirmed") {
          return ["already_confirmed", error];
        }
        return ["server_error", error];
      }

      return [null, null];
    });
  }

  /**
   * Send a login email for newsletter management
   */
  async sendLoginEmail(args: NewsletterSendLoginEmailArgs): Promise<NewsletterSendLoginEmailResult> {
    const { payload } = args;
    LoginEmailPayloadSchema.parse(payload);

    const response = await this.client.post<unknown>("/api/sdk/v1/newsletters/newsletter_subscription/login_email", payload);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const parsed = NewsletterErrorResponseSchema.safeParse(response.data);
        const error = parsed.success ? parsed.data : { error_identifier: "unknown_error" };
        if (response.status === 429) {
          return ["rate_limit_exceeded", error];
        }
        return ["server_error", error];
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
        return ["server_error", null];
      }

      const data = NewslettersResponseSchema.parse(response.data);
      return [null, data];
    });
  }

  /**
   * Get a newsletter by its internal name
   */
  async getByName(args: NewsletterGetByNameArgs): Promise<NewsletterGetByNameResult> {
    const { internalName } = args;
    const response = await this.client.get<unknown>(`/api/sdk/v1/newsletters/${internalName}`);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const parsed = NewsletterErrorResponseSchema.safeParse(response.data);
        const error = parsed.success ? parsed.data : { error_identifier: "unknown_error" };
        if (response.status === 404) {
          return ["not_found", error];
        }
        return ["server_error", error];
      }

      const data = NewsletterSchema.parse(response.data);
      return [null, data];
    });
  }
}
