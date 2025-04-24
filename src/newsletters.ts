import { UnidyClient } from "./client";
import type { ApiResponse } from "./client";

export interface CreateSubscriptionsResponse {
  created: NewsletterSubscription[],
  errors: NewsletterSubscriptionError[]
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  newsletter_internal_name: string;
  preference_identifiers?: string[];
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriptionError {
  newsletter_internal_name: string;
  error_identifier: string;
}

export interface createSubscriptionsPayload {
  email: string;
  newsletter_subscriptions: {
    newsletter_internal_name: string;
    preference_identifiers?: string[];
  }[];
}

export class NewsletterService {
  private client: UnidyClient;

  constructor(client: UnidyClient) {
    this.client = client;
  }

  async createSubscriptions(payload: createSubscriptionsPayload): Promise<ApiResponse<CreateSubscriptionsResponse>> {
    return this.client.post<CreateSubscriptionsResponse>("/api/sdk/v1/newsletter_subscriptions", payload);
  }

  onSubscriptionsCreated(callback: (subscriptions: NewsletterSubscription[]) => void): void {
    this.client.on('success', (response: ApiResponse) => {
      callback(response.data.created as NewsletterSubscription[]);
    });
  }

  onError(callback: (errors: NewsletterSubscriptionError[]) => void): void {
    this.client.on('error', (response: ApiResponse) => {
      callback(response.data.errors as NewsletterSubscriptionError[]);
    });
  }

  onUnconfirmedSubscriptionError(callback: (errors: NewsletterSubscriptionError[]) => void): void {
    this.onSpecificError(callback, "unconfirmed");
  }

  onAlreadySubscribedError(callback: (errors: NewsletterSubscriptionError[]) => void): void {
    this.onSpecificError(callback, "already_subscribed");
  }

  onInvalidEmailError(callback: (errors: NewsletterSubscriptionError[]) => void): void {
    this.onSpecificError(callback, "invalid_email");
  }

  private onSpecificError(callback: (errors: NewsletterSubscriptionError[]) => void, errorIdentifier: string): void {
    this.client.on('error', (response: ApiResponse) => {
      const specificErrors = response.data.errors.filter((error: { error_identifier: string }) => error.error_identifier === errorIdentifier);

      if (specificErrors.length > 0) {
        callback(specificErrors);
      }
    });
  }
}