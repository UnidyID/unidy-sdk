import { Component, Event, type EventEmitter, Prop, State, h } from "@stencil/core";
import { type NewsletterSubscription, type NewsletterSubscriptionError, UnidyClient } from "@unidy.io/sdk-api-client";

export type NewsletterConfig = {
  internalName: string;
  label: string;
  checked?: boolean;
  preferences?: {
    internalName: string;
    label: string;
    checked?: boolean;
  }[];
};

@Component({
  tag: "unidy-newsletter",
  styleUrl: "newsletter.css",
  shadow: true,
})
export class Newsletter {
  @Prop() header: string;
  @Prop() newslettersConfig: NewsletterConfig[] = [];
  @Prop() newslettersConfigJson: string;
  @Prop() submitButtonText = "Subscribe";
  @Prop() emailLabel = "Email";
  @Prop() emailPlaceholder = "Email";
  @Prop() apiUrl: string;
  @Prop() apiKey: string;

  @Prop() renderErrorMessages = false;
  @Prop() errorUnconfirmedText = "Email not confirmed";
  @Prop() errorAlreadySubscribedText = "Already subscribed";
  @Prop() errorInvalidEmailText = "Invalid email address";
  @Prop() errorNewsletterNotFoundText = "Newsletter not found";
  @Prop() errorPreferenceNotFoundText = "Preference not found";
  @Prop() errorUnknownText = "Unknown error occured";

  @State() email = "";
  @State() checkedNewsletters: Record<string, { preferences: string[]; checked: boolean }> = {};
  @State() messages: Record<string, { color: string; text: string; error_identifier: string }> = {};
  @State() showSuccessSlot = false;

  @Event({ eventName: "on:success" })
  successEvent: EventEmitter<NewsletterSubscription[]>;

  @Event({ eventName: "on:error" })
  errorEvent: EventEmitter<NewsletterSubscriptionError[]>;

  private client: UnidyClient;

  componentWillLoad() {
    this.client = new UnidyClient(this.apiUrl, this.apiKey);

    if (this.newslettersConfigJson) {
      try {
        this.newslettersConfig = JSON.parse(this.newslettersConfigJson);
      } catch (error) {
        console.error("Failed to parse newslettersConfigJson:", error);
      }
    }

    this.checkedNewsletters = this.newslettersConfig.reduce((acc, n) => {
      acc[n.internalName] = {
        preferences: n.preferences?.filter((p) => p.checked).map((p) => p.internalName) || [],
        checked: n.checked,
      };
      return acc;
    }, {});
  }

  private handleSubmit = async (e: Event) => {
    e.preventDefault();
    this.messages = {};

    this.showSuccessSlot = false;

    const payload = {
      email: this.email,
      newsletter_subscriptions: [],
    };

    const selectedNewsletters = Object.entries(this.checkedNewsletters)
      .filter(([_, data]) => data.checked)
      .map(([newsletterName, data]) => ({
        newsletter_internal_name: newsletterName,
        preference_identifiers: data.preferences,
      }));

    if (selectedNewsletters.length === 0) {
      console.error("No newsletters selected: please select at least one newsletter");
      return;
    }

    payload.newsletter_subscriptions = selectedNewsletters;

    const [error, response] = await this.client.newsletters.createSubscriptions(payload);

    if (error) {
      if (error === "newsletter_error") {
        const errors = response.data?.errors || [];
        this.errorEvent.emit(errors);

        const errorMessages: Record<string, { color: string; text: string; error_identifier: string }> = {};

        for (const error of errors) {
          const baseError = {
            color: "red",
            error_identifier: error.error_identifier,
          };

          let errorText: string;
          switch (error.error_identifier) {
            case "unconfirmed":
              errorText = this.errorUnconfirmedText;
              break;
            case "already_subscribed":
              errorText = this.errorAlreadySubscribedText;
              break;
            case "invalid_email":
              errorText = this.errorInvalidEmailText;
              break;
            case "newsletter_not_found":
              errorText = this.errorNewsletterNotFoundText;
              break;
            case "preferences_not_found":
              errorText = this.errorPreferenceNotFoundText;
              break;
            default:
              errorText = this.errorUnknownText;
              break;
          }

          errorMessages[error.newsletter_internal_name] = { ...baseError, text: errorText };
        }

        this.messages = { ...this.messages, ...errorMessages };
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

  private toggleNewsletter(newsletterName: string) {
    const newsletter = this.checkedNewsletters[newsletterName];
    const checked = !newsletter.checked;

    this.checkedNewsletters = {
      ...this.checkedNewsletters,
      [newsletterName]: {
        ...newsletter,
        checked: checked,
        preferences: checked ? newsletter.preferences : [],
      },
    };
  }

  private togglePreference(newsletterName: string, preferenceName: string) {
    const newsletter = this.checkedNewsletters[newsletterName];
    if (!newsletter || !newsletter.checked) return;

    const preferences = newsletter.preferences || [];
    const hasPreference = preferences.includes(preferenceName);

    const newPreferences = hasPreference ? preferences.filter((p) => p !== preferenceName) : [...preferences, preferenceName];

    this.checkedNewsletters = {
      ...this.checkedNewsletters,
      [newsletterName]: {
        ...newsletter,
        preferences: newPreferences,
      },
    };
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
          {/* If there is more than one newsletter or the first newsletter has preferences, show the checkboxes. */}
          {(this.newslettersConfig.length > 1 || this.newslettersConfig[0].preferences?.length > 0) &&
            this.newslettersConfig.map((newsletter) => (
              <div key={newsletter.internalName} class="space-y-2" part="newsletter-container">
                {/* For single newsletter there is no need to show the checkbox, only for preferences if they are defined */}
                {this.newslettersConfig.length > 1 && (
                  <div class="flex items-center gap-2">
                    <label class="font-bold text-lg" htmlFor={newsletter.internalName} part="newsletter-label">
                      {newsletter.label}
                    </label>
                    <input
                      type="checkbox"
                      id={newsletter.internalName}
                      value={newsletter.internalName}
                      checked={this.checkedNewsletters[newsletter.internalName].checked}
                      onChange={() => this.toggleNewsletter(newsletter.internalName)}
                      part="newsletter-checkbox"
                    />
                  </div>
                )}

                {newsletter.preferences && this.checkedNewsletters[newsletter.internalName].checked && (
                  <div class="ml-2 space-y-1" part="newsletter-preferences-container">
                    {newsletter.preferences.map((preference) => (
                      <label key={preference.internalName} class="flex items-center" part="newsletter-preference-label">
                        <input
                          type="checkbox"
                          id={`${newsletter.internalName}-${preference.internalName}`}
                          value={preference.internalName}
                          checked={this.checkedNewsletters[newsletter.internalName]?.preferences.includes(preference.internalName)}
                          onChange={() => this.togglePreference(newsletter.internalName, preference.internalName)}
                          class="mr-2"
                          part="newsletter-preference-checkbox"
                        />
                        <span class="font-medium">{preference.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {this.renderErrorMessages && this.messages[newsletter.internalName] && (
                  <div
                    key={`error-${newsletter.internalName}-${this.messages[newsletter.internalName].error_identifier}`}
                    part={`error-message ${this.messages[newsletter.internalName].error_identifier}`}
                    class={`!mt-1 ${this.messages[newsletter.internalName].error_identifier}`}
                  >
                    {this.messages[newsletter.internalName].text}
                  </div>
                )}
              </div>
            ))}

          <button part="submit-button" type="submit" class="w-full border">
            {this.submitButtonText}
          </button>

          {this.showSuccessSlot && <slot name="success-container" />}
        </form>
        <slot name="footer" />
      </div>
    );
  }
}
