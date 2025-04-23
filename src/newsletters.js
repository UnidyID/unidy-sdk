// src/newsletters.ts
class NewsletterService {
  client;
  constructor(client) {
    this.client = client;
  }
  async createSubscriptions(payload) {
    return this.client.post("/api/sdk/v1/newsletter_subscriptions", payload);
  }
  onSubscriptionsCreated(callback) {
    this.client.on("success", (response) => {
      if (response.data && "created_subscriptions" in response.data) {
        callback(response.data);
      }
    });
  }
  onSubscriptionError(callback) {
    this.client.on("error", callback);
  }
  onExistingUnconfirmedSubscriptionError(callback) {
    this.client.on("error", (response) => {
      const errors = response.data.errors || [];
      if (errors.some((error) => error.error_identifier === "unconfirmed")) {
        callback(response);
      }
    });
  }
  onInvalidEmailError(callback) {
    this.client.on("error", (response) => {
      const errors = response.data.errors || [];
      if (errors.some((error) => error.error_identifier === "validation_error" && error.details?.email)) {
        callback(response);
      }
    });
  }
}
export {
  NewsletterService
};
