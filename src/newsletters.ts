import { UnidyClient } from "./client";
import type { ApiResponse } from "./client";

export interface CreateSubscriptionsResponse {
  created_subscriptions: NewsletterSubscription[],
  invalid_subscriptions: any // TODO
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  newsletter_internal_name: string;
  preference_identifiers?: string[];
  created_at: string;
  updated_at: string;
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

  onSubscriptionsCreated(callback: (response: CreateSubscriptionsResponse) => void): void {
    this.client.on('success', (response: ApiResponse) => {
      if (response.data && 'created_subscriptions' in response.data) {
        callback(response.data as CreateSubscriptionsResponse);
      }
    });
  }

  // TODO proper error handling...
  onSubscriptionError(callback: (error: ApiResponse) => void): void {
    this.client.on('error', callback);
  }

  onExistingUnconfirmedSubscriptionError(callback: (error: ApiResponse) => void): void {
    this.client.on('error', (response: ApiResponse) => {
      const errors = response.data.errors || [];
      if (errors.some((error: { error_identifier: string }) =>
        error.error_identifier === "unconfirmed")) {

        callback(response);
      }
    });
  }

  onInvalidEmailError(callback: (error: ApiResponse) => void): void {
    this.client.on('error', (response: ApiResponse) => {
      const errors = response.data.errors || [];
      if (errors.some((error: { error_identifier: string; details?: { email?: any } }) =>
        error.error_identifier === "validation_error" && error.details?.email)) {

        callback(response);
      }
    });
  }
}