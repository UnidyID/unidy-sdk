import * as z from "zod";
import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api";

const NewsletterSubscriptionSchema = z.object({
  id: z.number(),
  email: z.string(),
  newsletter_internal_name: z.string(),
  preference_identifiers: z.array(z.string()),
  preference_token: z.string(),
  confirmed_at: z.union([z.string(), z.null()]),
});

const NewsletterSubscriptionErrorSchema = z.object({
  error_identifier: z.string(),
  error_details: z.optional(z.record(z.string(), z.array(z.string()))),
  meta: z.object({
    newsletter_internal_name: z.string(),
  }),
});

const CreateSubscriptionsResponseSchema = z.object({
  results: z.array(NewsletterSubscriptionSchema),
  errors: z.array(NewsletterSubscriptionErrorSchema),
});

const AdditionalFieldsSchema = z.object({
  first_name: z.optional(z.union([z.string(), z.null()])),
  last_name: z.optional(z.union([z.string(), z.null()])),
  salutation: z.optional(z.union([z.literal("mr"), z.literal("mrs"), z.literal("mx"), z.null()])),
  phone_number: z.optional(z.union([z.string(), z.null()])),
  date_of_birth: z.optional(z.union([z.string(), z.null()])),
  company_name: z.optional(z.union([z.string(), z.null()])),
  address_line_1: z.optional(z.union([z.string(), z.null()])),
  address_line_2: z.optional(z.union([z.string(), z.null()])),
  city: z.optional(z.union([z.string(), z.null()])),
  postal_code: z.optional(z.union([z.string(), z.null()])),
  country_code: z.optional(z.union([z.string(), z.null()])),
  preferred_language: z.optional(z.union([z.string(), z.null()])),
  custom_attributes: z.optional(z.union([z.record(z.string(), z.unknown()), z.null()])),
});

const CreateSubscriptionsPayloadSchema = z.object({
  email: z.string(),
  additional_fields: z.optional(AdditionalFieldsSchema),
  newsletter_subscriptions: z.array(
    z.object({
      newsletter_internal_name: z.string(),
      preference_identifiers: z.optional(z.array(z.string())),
    }),
  ),
  redirect_to_after_confirmation: z.optional(z.string()),
});

const UpdateSubscriptionPayloadSchema = z.object({
  preference_identifiers: z.array(z.string()),
});

const LoginEmailPayloadSchema = z.object({
  email: z.string(),
  redirect_uri: z.string(),
});

const ResendDoiPayloadSchema = z.object({
  redirect_to_after_confirmation: z.optional(z.string()),
});

const PreferenceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.union([z.string(), z.null()]),
  plugin_identifier: z.union([z.string(), z.null()]),
  position: z.number(),
  default: z.boolean(),
  hidden: z.boolean(),
});

const PreferenceGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  position: z.number(),
  flat: z.boolean(),
  preferences: z.array(PreferenceSchema),
});

const NewsletterSchema = z.object({
  id: z.number(),
  internal_name: z.string(),
  default: z.boolean(),
  position: z.number(),
  opt_in_type: z.string(),
  title: z.string(),
  description: z.union([z.string(), z.null()]),
  created_at: z.string(),
  updated_at: z.string(),
  preference_groups: z.array(PreferenceGroupSchema),
});

const NewslettersResponseSchema = z.object({
  newsletters: z.array(NewsletterSchema),
});

const DeleteSubscriptionResponseSchema = z
  .object({
    new_preference_token: z.string(),
  })
  .nullable();

const NewsletterErrorResponseSchema = z.object({
  error_identifier: z.string(),
});

export type NewsletterSubscription = z.infer<typeof NewsletterSubscriptionSchema>;
export type NewsletterSubscriptionError = z.infer<typeof NewsletterSubscriptionErrorSchema>;
export type CreateSubscriptionsResponse = z.infer<typeof CreateSubscriptionsResponseSchema>;
export type CreateSubscriptionsPayload = z.infer<typeof CreateSubscriptionsPayloadSchema>;
export type AdditionalFields = z.infer<typeof AdditionalFieldsSchema>;
export type UpdateSubscriptionPayload = z.infer<typeof UpdateSubscriptionPayloadSchema>;
export type LoginEmailPayload = z.infer<typeof LoginEmailPayloadSchema>;
export type ResendDoiPayload = z.infer<typeof ResendDoiPayloadSchema>;
export type Newsletter = z.infer<typeof NewsletterSchema>;
export type NewslettersResponse = z.infer<typeof NewslettersResponseSchema>;
export type Preference = z.infer<typeof PreferenceSchema>;
export type PreferenceGroup = z.infer<typeof PreferenceGroupSchema>;
export type NewsletterErrorResponse = z.infer<typeof NewsletterErrorResponseSchema>;

export type SubscriptionAuthOptions = {
  idToken?: string;
  preferenceToken?: string;
};

// Result types using tuples - following AuthService pattern
export type CreateSubscriptionsResult =
  | CommonErrors
  | ["rate_limit_exceeded", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | ["server_error", NewsletterErrorResponse]
  | ["newsletter_error", CreateSubscriptionsResponse]
  | [null, CreateSubscriptionsResponse];

export type ListSubscriptionsResult = CommonErrors | ["unauthorized", NewsletterErrorResponse] | [null, NewsletterSubscription[]];

export type GetSubscriptionResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | [null, NewsletterSubscription];

export type UpdateSubscriptionResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | [null, NewsletterSubscription];

export type DeleteSubscriptionResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | [null, { new_preference_token: string } | null];

export type ResendDoiResult =
  | CommonErrors
  | ["not_found", NewsletterErrorResponse]
  | ["unauthorized", NewsletterErrorResponse]
  | ["already_confirmed", NewsletterErrorResponse]
  | [null, null];

export type SendLoginEmailResult = CommonErrors | ["rate_limit_exceeded", NewsletterErrorResponse] | [null, null];

export type ListNewslettersResult = CommonErrors | [null, NewslettersResponse];

export type GetNewsletterResult = CommonErrors | ["not_found", NewsletterErrorResponse] | [null, Newsletter];

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

  async createSubscriptions(payload: CreateSubscriptionsPayload, auth?: SubscriptionAuthOptions): Promise<CreateSubscriptionsResult> {
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

  async listSubscriptions(auth: SubscriptionAuthOptions): Promise<ListSubscriptionsResult> {
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

  async getSubscription(internalName: string, auth: SubscriptionAuthOptions): Promise<GetSubscriptionResult> {
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

  async updateSubscription(
    internalName: string,
    payload: UpdateSubscriptionPayload,
    auth: SubscriptionAuthOptions,
  ): Promise<UpdateSubscriptionResult> {
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

  async deleteSubscription(internalName: string, auth: SubscriptionAuthOptions): Promise<DeleteSubscriptionResult> {
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

  async resendDoi(internalName: string, payload: ResendDoiPayload, auth: SubscriptionAuthOptions): Promise<ResendDoiResult> {
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

  async sendLoginEmail(payload: LoginEmailPayload): Promise<SendLoginEmailResult> {
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

  async listNewsletters(): Promise<ListNewslettersResult> {
    const response = await this.client.get<unknown>("/api/sdk/v1/newsletters");

    return this.handleResponse(response, () => {
      if (!response.success) {
        throw new Error("Failed to fetch newsletters");
      }

      const data = NewslettersResponseSchema.parse(response.data);
      return [null, data];
    });
  }

  async getNewsletter(internalName: string): Promise<GetNewsletterResult> {
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
