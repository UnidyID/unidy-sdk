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

export type NewsletteerErrorIdentifier =
  | "unconfirmed"
  | "already_subscribed"
  | "invalid_email"
  | "newsletter_not_found"
  | "preferences_not_found"
  | "unknown";

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
  @Prop() returnToAfterConfirmation?: string;
  @Prop() successConfirmationText = "You have successfully confirmed your newsletter subscription.";
  @Prop() confirmationErrorText = "Your preference token could not be assigned. Enter your e-mail address to receive a new link.";


  @State() email = "";
  @State() checkedNewsletters: Record<string, { preferences: string[]; checked: boolean }> = {};
  @State() errors: Record<string, { error_identifier: string }> = {};
  @State() showSuccessSlot = false;
  @State() showConfirmSuccessSlot = false;
  @State() showConfirmationErrorSlot = false;

  @Event({ eventName: "on:success" })
  successEvent: EventEmitter<NewsletterSubscription[]>;

  @Event({ eventName: "on:error" })
  errorEvent: EventEmitter<NewsletterSubscriptionError[]>;

  @Event()
  resetStatus: EventEmitter<void>;

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

    const params = new URLSearchParams(window.location.search);
    const status = params.get("newsletter_status");
    const selectedParam = params.get("selected");
    if (selectedParam) {
      const selected = JSON.parse(selectedParam);
      // console.log("Selected newsletter from URL:", selected);
      this.applySelectedFromQuery(selected);
    }

    if (status === 'confirmed') {
      this.handleSuccessStatus();
    } else if (status === 'invalid_preference_token') {
      this.handleErrorStatus();
    }
  }

  private applySelectedFromQuery(selected: { newsletter_internal_name: string, preference_identifiers: string[] }[]) {
    const newState: Record<string, { checked: boolean, preferences: string[] }> = {};

    for (const newsletter of this.newslettersConfig) {
      const found = selected.find(s => s.newsletter_internal_name === newsletter.internalName);

      if (found) {
        newState[newsletter.internalName] = {
          checked: true,
          preferences: found.preference_identifiers || [],
        };
      } else {
        newState[newsletter.internalName] = {
          checked: false,
          preferences: [],
        };
      }
    }

    this.checkedNewsletters = newState;

    setTimeout(() => {
      const url = new URL(window.location.href);
      ['newsletter_status', 'email', 'selected'].forEach(param => url.searchParams.delete(param));
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }, 5000);
  }


  private handleErrorStatus() {
    this.showConfirmSuccessSlot = false;
    this.showSuccessSlot = false;
    this.showConfirmationErrorSlot = true;

    setTimeout(() => {
      this.resetStatus.emit();

      const url = new URL(window.location.href);
      url.searchParams.delete("newsletter_status");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }, 5000);
  }

  private handleSuccessStatus() {
    this.showConfirmSuccessSlot = true;
    this.showSuccessSlot = false;

    setTimeout(() => {
      this.showConfirmSuccessSlot = false;
      this.resetStatus.emit();

      const url = new URL(window.location.href);
      url.searchParams.delete("newsletter_status");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }, 5000);
  }

  private handleSubmit = async (e: Event) => {
    e.preventDefault();
    this.errors = {};
    this.showSuccessSlot = false;

    const payload = {
      email: this.email,
      newsletter_subscriptions: [],
      return_to_after_confirmation: this.returnToAfterConfirmation || window.location.href,
    };

    const selectedNewsletters = Object.entries(this.checkedNewsletters)
      .filter(([_, data]) => data.checked)
      .map(([newsletterName, data]) => ({
        newsletter_internal_name: newsletterName,
        preference_identifiers: data.preferences
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

        const errorMessages: Record<string, { error_identifier: string }> = {};
        for (const error of errors) {
          errorMessages[error.newsletter_internal_name] = {
            error_identifier: error.error_identifier,
          };
        }

        this.errors = { ...this.errors, ...errorMessages };
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


  private getErrorText(error_identifier: NewsletteerErrorIdentifier): string {
    switch (error_identifier) {
      case "unconfirmed":
        return this.errorUnconfirmedText;
      case "already_subscribed":
        return this.errorAlreadySubscribedText;
      case "invalid_email":
        return this.errorInvalidEmailText;
      case "newsletter_not_found":
        return this.errorNewsletterNotFoundText;
      case "preferences_not_found":
        return this.errorPreferenceNotFoundText;
      default:
        return this.errorUnknownText;
    }
  }

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

  private renderErrorMessage(newsletterName: string) {
    if (!this.renderErrorMessages || !this.errors[newsletterName]) {
      return null;
    }

    const message = this.errors[newsletterName];
    return (
      <div
        key={`error-${newsletterName}-${message.error_identifier}`}
        part={`error-message ${message.error_identifier}`}
        class={`${message.error_identifier}`}
      >
        {this.getErrorText(message.error_identifier as NewsletteerErrorIdentifier)}
      </div>
    );
  }

  render() {
    return (
      <div part="container" class="max-w-lg">
        <slot name="header" />
        {this.header && <h1 part="heading">{this.header}</h1>}
        <slot name="description" />
        <form onSubmit={this.handleSubmit} class="flex flex-col gap-2">
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
          {/* If there is more than one newsletter or the first newsletter has preferences, show the checkboxes in containers */}
          {(this.newslettersConfig.length > 1 || this.newslettersConfig[0].preferences?.length > 0) &&
            this.newslettersConfig.map((newsletter) => (
              <div key={newsletter.internalName} class="flex flex-col gap-2" part="newsletter-container">
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
                  <div class={`${this.newslettersConfig.length > 1 ? "ml-2" : ""}`} part="newsletter-preferences-container">
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

                {this.renderErrorMessage(newsletter.internalName)}
              </div>
            ))}

          {/* Show error messages for single newsletters without preferences outside of the newsletter container */}
          {this.newslettersConfig.length === 1 &&
            !this.newslettersConfig[0].preferences?.length &&
            this.renderErrorMessage(this.newslettersConfig[0].internalName)}

          <button part="submit-button" type="submit" class="w-full border">
            {this.submitButtonText}
          </button>

          {this.showSuccessSlot && <slot name="success-container" />}
          {this.showConfirmSuccessSlot && (
            <slot name="confirm-success-container">
              <p part="confirm-success-text">{this.successConfirmationText}</p>
            </slot>
          )}

          {this.showConfirmationErrorSlot && (
            <slot name="confirmation-error-container">
              <p part="confirmaton-error-text">{this.confirmationErrorText}</p>
            </slot>
          )}

        </form>
        <slot name="footer" />
      </div>
    );
  }
}
