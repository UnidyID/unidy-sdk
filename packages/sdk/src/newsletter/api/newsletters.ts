import * as Sentry from "@sentry/browser";
import * as z from "zod";
import { type ApiClient, type ApiResponse, BaseService } from "../../api";

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

export type SubscriptionAuthOptions = {
  idToken?: string;
  preferenceToken?: string;
};

export type CreateSubscriptionsResult =
  | ["connection_failed", null]
  | ["schema_validation_error", ApiResponse<CreateSubscriptionsResponse>]
  | ["rate_limit_exceeded", ApiResponse<CreateSubscriptionsResponse>]
  | ["unauthorized", ApiResponse<CreateSubscriptionsResponse>]
  | ["newsletter_error", ApiResponse<CreateSubscriptionsResponse>]
  | ["server_error", ApiResponse<CreateSubscriptionsResponse>]
  | ["error", ApiResponse<CreateSubscriptionsResponse>]
  | [null, ApiResponse<CreateSubscriptionsResponse>];

export class NewsletterService extends BaseService {
  constructor(client: ApiClient) {
    super(client, "NewsletterService");
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

    const response = await this.client.post<CreateSubscriptionsResponse>(
      "/api/sdk/v1/newsletters/newsletter_subscription",
      payload,
      this.buildSubscriptionAuthHeaders(auth),
    );

    if (response.connectionError) {
      return ["connection_failed", null];
    }

    switch (response.status) {
      case 401:
        return ["unauthorized", response];
      case 429:
        this.logger.warn("Rate limit exceeded");
        return ["rate_limit_exceeded", response];
      case 500:
        Sentry.captureException(response);
        return ["server_error", response];
      default:
        if (response.data) {
          try {
            const validatedData = CreateSubscriptionsResponseSchema.parse(response.data);

            if (validatedData.errors.length > 0) {
              return ["newsletter_error", response];
            }

            return [null, response];
          } catch (validationError) {
            this.logger.error("Schema validation error", validationError);
            return ["schema_validation_error", response];
          }
        }

        return ["error", response];
    }
  }

  async listSubscriptions(auth: SubscriptionAuthOptions): Promise<ApiResponse<NewsletterSubscription[]>> {
    return this.client.get<NewsletterSubscription[]>(
      "/api/sdk/v1/newsletters/newsletter_subscription",
      this.buildSubscriptionAuthHeaders(auth),
    );
  }

  async getSubscription(internalName: string, auth: SubscriptionAuthOptions): Promise<ApiResponse<NewsletterSubscription>> {
    return this.client.get<NewsletterSubscription>(
      `/api/sdk/v1/newsletters/${internalName}/newsletter_subscription`,
      this.buildSubscriptionAuthHeaders(auth),
    );
  }

  async updateSubscription(
    internalName: string,
    payload: UpdateSubscriptionPayload,
    auth: SubscriptionAuthOptions,
  ): Promise<ApiResponse<NewsletterSubscription>> {
    UpdateSubscriptionPayloadSchema.parse(payload);

    return this.client.patch<NewsletterSubscription>(
      `/api/sdk/v1/newsletters/${internalName}/newsletter_subscription`,
      payload,
      this.buildSubscriptionAuthHeaders(auth),
    );
  }

  async deleteSubscription(
    internalName: string,
    auth: SubscriptionAuthOptions,
  ): Promise<ApiResponse<{ new_preference_token: string } | null>> {
    return this.client.delete<{ new_preference_token: string } | null>(
      `/api/sdk/v1/newsletters/${internalName}/newsletter_subscription`,
      this.buildSubscriptionAuthHeaders(auth),
    );
  }

  async resendDoi(internalName: string, payload: ResendDoiPayload, auth: SubscriptionAuthOptions): Promise<ApiResponse<null>> {
    ResendDoiPayloadSchema.parse(payload);

    return this.client.post<null>(
      `/api/sdk/v1/newsletters/${internalName}/newsletter_subscription/resend_doi`,
      payload,
      this.buildSubscriptionAuthHeaders(auth),
    );
  }

  async sendLoginEmail(payload: LoginEmailPayload): Promise<ApiResponse<null>> {
    LoginEmailPayloadSchema.parse(payload);

    return this.client.post<null>("/api/sdk/v1/newsletters/newsletter_subscription/login_email", payload);
  }

  async listNewsletters(): Promise<ApiResponse<NewslettersResponse>> {
    return this.client.get<NewslettersResponse>("/api/sdk/v1/newsletters");
  }

  async getNewsletter(internalName: string): Promise<ApiResponse<Newsletter>> {
    return this.client.get<Newsletter>(`/api/sdk/v1/newsletters/${internalName}`);
  }
}
