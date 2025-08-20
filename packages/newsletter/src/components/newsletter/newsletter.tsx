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

export type NewsletterErrorIdentifier =
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
  @Prop() newslettersConfigJson: string | NewsletterConfig[];
  @Prop() additionalFields: { name: string; label: string; type: string; required?: boolean }[] = [];
  @Prop() additionalFieldsConfigJson: string;
  @Prop() submitButtonText = "Subscribe";
  @Prop() emailLabel = "Email";
  @Prop() emailPlaceholder = "Email";
  @Prop() apiUrl: string;
  @Prop() apiKey: string;
  @Prop() returnToAfterConfirmation?: string;

  @Prop() renderErrorMessages = false;
  @Prop() errorUnconfirmedText = "Your email is not confirmed.";
  @Prop() errorAlreadySubscribedText = "Already subscribed";
  @Prop() errorInvalidEmailText = "Invalid email address";
  @Prop() errorNewsletterNotFoundText = "Newsletter not found";
  @Prop() errorPreferenceNotFoundText = "Preference not found";
  @Prop() errorUnknownText = "Unknown error occured";
  @Prop() errorResendConfirmationActionText = "Resend confirmation email";
  @Prop() errorResendConfirmationSuccessText = "Please check your inbox for the confirmation email.";
  @Prop() successConfirmationText = "You have successfully confirmed your newsletter subscription.";
  @Prop() confirmationErrorText = "Your preference token could not be assigned. Enter your e-mail address to receive a new link.";

  @State() email = "";
  @State() checkedNewsletters: Record<string, { preferences: string[]; checked: boolean }> = {};
  @State() additionalFieldValues: Record<string, string> = {};

  @State() errors: Record<string, { error_identifier: string }> = {};
  @State() showSubscribeSuccessSlot = false;
  @State() showConfirmSuccessSlot = false;
  @State() showConfirmationErrorSlot = false;

  // New state to track which newsletters are currently resending the DOI email.
  @State() resendingDoi: string[] = [];

  @Event({ eventName: "success" })
  successEvent: EventEmitter<NewsletterSubscription[]>;

  @Event({ eventName: "error" })
  errorEvent: EventEmitter<NewsletterSubscriptionError[]>;

  @Event()
  resetStatus: EventEmitter<void>;

  private client: UnidyClient;

  componentWillLoad() {
    window.addEventListener("unidy:auth", (event: CustomEvent) => {
      const { userData } = event.detail;

      if (userData) {
        this.prefillForm(userData);
      }
    });

    this.client = new UnidyClient(this.apiUrl, this.apiKey);

    if (this.newslettersConfigJson) {
      try {
        if (typeof this.newslettersConfigJson === "string") {
          this.newslettersConfig = JSON.parse(this.newslettersConfigJson);
        } else if (Array.isArray(this.newslettersConfigJson)) {
          this.newslettersConfig = this.newslettersConfigJson;
        } else {
          console.warn("newslettersConfigJson provided in unsupported format; expected json string or array");
        }
      } catch (error) {
        console.error("Failed to parse newslettersConfigJson:", error);
      }
    }

    if (this.additionalFieldsConfigJson) {
      try {
        if (typeof this.additionalFieldsConfigJson === "string") {
          this.additionalFields = JSON.parse(this.additionalFieldsConfigJson);
        } else if (Array.isArray(this.additionalFieldsConfigJson)) {
          this.additionalFields = this.additionalFieldsConfigJson;
        } else {
          console.warn("additionalFieldsConfigJson provided in unsupported format; expected string or array");
        }
      } catch (error) {
        console.error("Failed to parse additionalFieldsConfigJson:", error);
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
    const confirmationError = params.get("newsletter_error");
    const selectedParam = params.get("selected");
    // For future preference center
    // if (selectedParam) {
    //   const selected = JSON.parse(selectedParam);
    // }

    if (confirmationError) {
      this.handleConfirmationError();
    } else if (selectedParam) {
      this.handleConfirmationSuccess();
    }
  }

  private prefillForm(userData: Record<string, unknown>) {
    if (userData?.email && typeof userData.email === "string" && !this.email) {
      this.email = userData.email;
    }

    if (this.additionalFields.length > 0) {
      const updatedFields: Record<string, string> = {};

      for (const field of this.additionalFields) {
        const value = userData[field.name];
        if (value) {
          updatedFields[field.name] = value as string;
        }
      }

      this.additionalFieldValues = updatedFields;
    }
  }

  private handleConfirmationError() {
    this.showConfirmSuccessSlot = false;
    this.showSubscribeSuccessSlot = false;
    this.showConfirmationErrorSlot = true;

    setTimeout(() => {
      this.resetStatus.emit();
      const url = new URL(window.location.href);
      url.searchParams.delete("newsletter_error");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }, 5000);
  }

  private handleConfirmationSuccess() {
    this.showConfirmSuccessSlot = true;
    this.showSubscribeSuccessSlot = false;

    setTimeout(() => {
      this.showConfirmSuccessSlot = false;
      this.resetStatus.emit();
    }, 5000);
  }

  private buildReturnUrlWithoutConfirmedParams() {
    const baseUrl = `${location.origin}${location.pathname}`;
    const params = new URLSearchParams(location.search);
    for (const key of ["email", "selected"]) {
      params.delete(key);
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  private handleResendDoi = async (preferenceToken: string, email: string) => {
    this.client.newsletters.resendDoi(preferenceToken, email);
    this.resendingDoi = [...this.resendingDoi, preferenceToken];
  };

  private handleSubmit = async (e: Event) => {
    e.preventDefault();
    this.errors = {};
    this.showSubscribeSuccessSlot = false;

    const customAttributes = Object.entries(this.additionalFieldValues)
      .filter(([key]) => key.startsWith("custom_attribute:"))
      .reduce(
        (acc, [key, value]) => {
          // Remove the 'custom_attribute:' prefix from the key
          const cleanKey = key.replace("custom_attribute:", "");
          acc[cleanKey] = value;
          return acc;
        },
        {} as Record<string, string>,
      );

    // Remove custom_attribute fields from additionalFieldValues
    const nonCustomFields = Object.entries(this.additionalFieldValues)
      .filter(([key]) => !key.startsWith("custom_attribute:"))
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string>,
      );

    const payload = {
      email: this.email,
      newsletter_subscriptions: [],
      return_to_after_confirmation: this.returnToAfterConfirmation || this.buildReturnUrlWithoutConfirmedParams(),
      additional_fields: {
        ...nonCustomFields,
        custom_attributes: customAttributes,
      },
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
      this.showSubscribeSuccessSlot = true;
      this.successEvent.emit(response.data.results);
    }

    this.email = "";
  };

  private getErrorText(error_identifier: NewsletterErrorIdentifier): string {
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
    const errorIdentifier = message.error_identifier as NewsletterErrorIdentifier;
    const isUnconfirmed = errorIdentifier === "unconfirmed";
    const isResending = this.resendingDoi.includes(newsletterName);

    return (
      <div key={`error-${newsletterName}-${errorIdentifier}`} part={`error-message ${errorIdentifier}`} class={`${errorIdentifier}`}>
        {!isUnconfirmed && this.getErrorText(errorIdentifier)}

        {isUnconfirmed && !isResending && (
          <>
            {this.errorUnconfirmedText}
            <button
              type="button"
              onClick={() => this.handleResendDoi(newsletterName, this.email)}
              part="resend-doi-button"
              class="ml-2 underline cursor-pointer"
            >
              {this.errorResendConfirmationActionText}
            </button>
          </>
        )}

        {isUnconfirmed && isResending && (
          <span part="resending-doi-text" class="ml-2">
            {this.errorResendConfirmationSuccessText}
          </span>
        )}
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

          {this.additionalFields.length > 0 &&
            this.additionalFields.map((field) => (
              <div key={field.name} class="flex flex-col gap-2" part="additional-field-input-group">
                <label htmlFor={field.name} part="additional-field-label">
                  {field.label}
                </label>
                <input
                  name={field.name}
                  type={field.type}
                  part="additional-field-input"
                  required={field.required}
                  value={this.additionalFieldValues[field.name] || ""}
                  onInput={(e) => {
                    this.additionalFieldValues = {
                      ...this.additionalFieldValues,
                      [field.name]: (e.target as HTMLInputElement).value,
                    };
                  }}
                />
              </div>
            ))}

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

          {this.showSubscribeSuccessSlot && <slot name="success-container" />}
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
