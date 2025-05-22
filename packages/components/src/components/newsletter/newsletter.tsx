import { Component, Event, type EventEmitter, Prop, State, h } from "@stencil/core";
import { type NewsletterSubscription, type NewsletterSubscriptionError, UnidyClient } from "@unidy.io/sdk-api-client";

@Component({
  tag: "unidy-newsletter",
  styleUrl: "newsletter.css",
  shadow: true,
})
export class Newsletter {
  @Prop() header: string;
  @Prop() newslettersConfig: { internal_name: string; label: string; checked?: boolean }[] = [];
  @Prop() defaultNewsletterInternalName: string;
  @Prop() submitButtonText = "Subscribe";
  @Prop() emailLabel = "E-mail";
  @Prop() emailPlaceholder = "E-mail";
  @Prop() apiUrl: string;
  @Prop() apiKey: string;

  @Prop() renderErrorMessages = false;
  @Prop() errorUnconfirmedText = "Email not confirmed";
  @Prop() errorAlreadySubscribedText = "Already subscribed";
  @Prop() errorInvalidEmailText = "Invalid email address";
  @Prop() errorUnknownText = "Unknown error occured";

  @State() email = "";
  @State() checkedNewsletters: string[] = [];
  @State() messages: { color: string; text: string; error_identifier: string }[] = [];
  @State() showSuccessSlot = false;

  @Event({ eventName: "on:success" })
  successEvent: EventEmitter<NewsletterSubscription[]>;

  @Event({ eventName: "on:error" })
  errorEvent: EventEmitter<NewsletterSubscriptionError[]>;

  private client: UnidyClient;

  componentWillLoad() {
    this.client = new UnidyClient(this.apiUrl, this.apiKey);

    this.checkedNewsletters = (this.newslettersConfig || []).filter((n) => n.checked).map((n) => n.internal_name);
  }

  private handleSubmit = async (e: Event) => {
    e.preventDefault();
    this.messages = [];
    this.showSuccessSlot = false;

    const payload = {
      email: this.email,
      newsletter_subscriptions:
        this.checkedNewsletters.length > 0
          ? this.checkedNewsletters.map((newsletter) => ({ newsletter_internal_name: newsletter }))
          : [{ newsletter_internal_name: this.defaultNewsletterInternalName }],
    };

    const [error, response] = await this.client.newsletters.createSubscriptions(payload);

    if (error) {
      if (error === "newsletter_error") {
        const errors = response.data?.errors || [];
        this.errorEvent.emit(errors);

        const errorMessages = errors.map((error: { error_identifier: string; newsletter_internal_name: string }) => {
          switch (error.error_identifier) {
            case "unconfirmed":
              return { color: "red", text: this.errorUnconfirmedText, error_identifier: error.error_identifier };
            case "already_subscribed":
              return { color: "red", text: this.errorAlreadySubscribedText, error_identifier: error.error_identifier };
            case "invalid_email":
              return { color: "red", text: this.errorInvalidEmailText, error_identifier: error.error_identifier };
            default:
              return { color: "red", text: this.errorUnknownText, error_identifier: error.error_identifier };
          }
        });

        this.messages = [...this.messages, ...errorMessages];
        return;
      }
      if (error === "rate_limit_exceeded") {
        alert("Rate limit exceeded. Please try again later.");
      }
    } else {
      this.showSuccessSlot = true;
      this.successEvent.emit(response.data.results);
    }

    this.email = "";
  };

  private toggleNewsletter(value: string) {
    this.checkedNewsletters = this.checkedNewsletters.includes(value)
      ? this.checkedNewsletters.filter((v) => v !== value)
      : [...this.checkedNewsletters, value];
  }

  render() {
    return (
      <div part="container" class="max-w-lg">
        <slot name="header" />
        {this.header && <h1 part="heading">{this.header}</h1>}
        <slot name="description" />
        <form onSubmit={this.handleSubmit} class="space-y-4">
          <div part="email-input-group">
            <label part="email-input-label" htmlFor="email-input">
              {this.emailLabel}
            </label>
            <input
              id="email-input"
              type="email"
              part="email-input"
              required
              placeholder={this.emailPlaceholder}
              value={this.email}
              onInput={(e) => {
                this.email = (e.target as HTMLInputElement).value;
              }}
              class="w-full border"
            />
          </div>

          {this.newslettersConfig.map((newsletter) => (
            <label key={newsletter.internal_name} class="flex items-center">
              <input
                type="checkbox"
                id={newsletter.internal_name}
                value={newsletter.internal_name}
                checked={this.checkedNewsletters.includes(newsletter.internal_name)}
                onChange={() => this.toggleNewsletter(newsletter.internal_name)}
                class="mr-2"
              />
              {newsletter.label}
            </label>
          ))}

          <button part="submit-button" type="submit" class="w-full border">
            {this.submitButtonText}
          </button>

          {this.renderErrorMessages && (
            <div part="error-messages-container" class="text-sm">
              {this.messages.map((message, index) => (
                <div key={`error-${index}-${message.error_identifier}`} part={`error-${message.error_identifier}`} class="!mt-1">
                  {message.text}
                </div>
              ))}
            </div>
          )}

          {this.showSuccessSlot && <slot name="success-container" />}
        </form>
        <slot name="footer" />
      </div>
    );
  }
}
