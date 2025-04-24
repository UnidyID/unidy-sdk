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
      callback(response.data.created);
    });
  }
  onError(callback) {
    this.client.on("error", (response) => {
      callback(response.data.errors);
    });
  }
  onUnconfirmedSubscriptionError(callback) {
    this.onSpecificError(callback, "unconfirmed");
  }
  onAlreadySubscribedError(callback) {
    this.onSpecificError(callback, "already_subscribed");
  }
  onInvalidEmailError(callback) {
    this.onSpecificError(callback, "invalid_email");
  }
  onSpecificError(callback, errorIdentifier) {
    this.client.on("error", (response) => {
      const specificErrors = response.data.errors.filter((error) => error.error_identifier === errorIdentifier);
      if (specificErrors.length > 0) {
        callback(specificErrors);
      }
    });
  }
}
export {
  NewsletterService
};
