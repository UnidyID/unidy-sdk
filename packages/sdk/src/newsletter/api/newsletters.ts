import * as Sentry from "@sentry/browser";
import * as z from "zod/mini";
import type { ApiClient, ApiResponse } from "../../api";
import EventEmitter from "eventemitter3";

const NewsletterSubscriptionSchema = z.object({
  id: z.number(),
  email: z.string(),
  newsletter_internal_name: z.string(),
  preference_identifiers: z.array(z.string()),
  preference_token: z.string(),
  confirmed_at: z.union([z.string(), z.null()]),
});

const NewsletterSubscriptionErrorSchema = z.object({
  newsletter_internal_name: z.string(),
  error_identifier: z.string(),
});

const CreateSubscriptionsResponseSchema = z.object({
  results: z.array(NewsletterSubscriptionSchema),
  errors: z.array(NewsletterSubscriptionErrorSchema),
});

const CreateSubscriptionsPayloadSchema = z.object({
  email: z.string(),
  newsletter_subscriptions: z.array(
    z.object({
      newsletter_internal_name: z.string(),
      preference_identifiers: z.optional(z.array(z.string())),
    }),
  ),
  return_to_after_confirmation: z.optional(z.string()),
});

export type NewsletterSubscription = z.infer<typeof NewsletterSubscriptionSchema>;
export type NewsletterSubscriptionError = z.infer<typeof NewsletterSubscriptionErrorSchema>;
export type CreateSubscriptionsResponse = z.infer<typeof CreateSubscriptionsResponseSchema>;
export type CreateSubscriptionsPayload = z.infer<typeof CreateSubscriptionsPayloadSchema>;

export type CreateSubscriptionsResult =
  | ["schema_validation_error", ApiResponse<CreateSubscriptionsResponse>]
  | ["rate_limit_exceeded", ApiResponse<CreateSubscriptionsResponse>]
  | ["newsletter_error", ApiResponse<CreateSubscriptionsResponse>]
  | ["network_error", ApiResponse<CreateSubscriptionsResponse>]
  | ["server_error", ApiResponse<CreateSubscriptionsResponse>]
  | ["error", ApiResponse<CreateSubscriptionsResponse>]
  | [null, ApiResponse<CreateSubscriptionsResponse>];

export class NewsletterService extends EventEmitter {
  private client: ApiClient;

  constructor(client: ApiClient) {
    super();
    this.client = client;
  }

  async createSubscriptions(payload: CreateSubscriptionsPayload): Promise<CreateSubscriptionsResult> {
    CreateSubscriptionsPayloadSchema.parse(payload);

    const response = await this.client.post<CreateSubscriptionsResponse>("/api/sdk/v1/newsletter_subscriptions", payload);

    switch (response.status) {
      case 429:
        console.warn("Rate limit exceeded");
        this.emit("rate_limit_exceeded", response);

        return ["rate_limit_exceeded", response];
      case 500:
        Sentry.captureException(response)
        return ["server_error", response];
      case 0:
        return ["network_error", response];
      default:
        if (response.data) {
          try {
            const validatedData = CreateSubscriptionsResponseSchema.parse(response.data);

            if (validatedData.errors.length > 0) {
              this.emit("newsletter_error", response);

              return ["newsletter_error", response];
            }

            return [null, response];
          } catch (validationError) {
            return ["schema_validation_error", response];
          }
        }

        return ["error", response];
    }
  }

  async resendDoi(newsletterName: string, email: string): Promise<boolean> {
    const response = await this.client.post<null>(`/api/sdk/v1/newsletters/${newsletterName}/resend_doi`, { email });

    return response.status === 204;
  }

  onError(
    callback: (errors: z.infer<typeof NewsletterSubscriptionErrorSchema>[]) => void,
    errorIdentifier?: "unconfirmed" | "already_subscribed" | "invalid_email",
  ): void {
    this.on("newsletter_error", (response: ApiResponse<CreateSubscriptionsResponse>) => {
      if (!response.data?.errors) {
        return;
      }

      const errors = errorIdentifier
        ? response.data.errors.filter(
            (error: {
              error_identifier: string;
            }) => error.error_identifier === errorIdentifier,
          )
        : response.data.errors;

      if (errors.length > 0) {
        callback(errors);
      }
    });
  }

  onRateLimitError(callback: () => void): void {
    this.on("rate_limit_exceeded", (response: ApiResponse<CreateSubscriptionsResponse>) => {
      if (response.status === 429) {
        callback();
      }
    });
  }
}
