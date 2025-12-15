import { getUnidyClient } from "../api";
import { Flash } from "../shared/store/flash-store";
import { t } from "../i18n";
import { newsletterStore, persist, type NewsletterErrorIdentifier, type ExistingSubscription } from "./store/newsletter-store";

const PERSIST_KEY_PREFIX = "unidy_newsletter_";

export class NewsletterHelpers {
  static logout(): void {
    newsletterStore.state.preferenceToken = "";
    newsletterStore.state.email = "";
    newsletterStore.state.existingSubscriptions = [];
    localStorage.removeItem(`${PERSIST_KEY_PREFIX}preferenceToken`);
    localStorage.removeItem(`${PERSIST_KEY_PREFIX}email`);
  }

  static async resendDoi(internalName: string): Promise<boolean> {
    const { preferenceToken } = newsletterStore.state;

    if (!preferenceToken) {
      return false;
    }

    newsletterStore.state.resendingDoi = [...newsletterStore.state.resendingDoi, internalName];

    const response = await getUnidyClient().newsletters.resendDoi(internalName, {
      preferenceToken,
    });

    newsletterStore.state.resendingDoi = newsletterStore.state.resendingDoi.filter(
      (name) => name !== internalName,
    );

    if (response.status === 204) {
      Flash.success.addMessage(t("newsletter.doi_resent"));
      return true;
    }

    if (response.status === 401) {
      Flash.error.addMessage(t("newsletter.errors.invalid_preference_token"));
      return false;
    }

    Flash.error.addMessage(t("newsletter.errors.resend_doi_failed"));
    return false;
  }

  static async sendLoginEmail(email: string): Promise<void> {
    const response = await getUnidyClient().newsletters.sendLoginEmail({
      email,
      redirect_uri: NewsletterHelpers.returnToAfterConfirmationUrl(),
    });

    if (response.status === 204) {
      Flash.info.addMessage(t("newsletter.login_email_sent"));
    }
  }

  static async fetchNewsletterConfigs(): Promise<void> {
    if (newsletterStore.state.newsletterConfigs.length > 0) {
      return; // Already fetched
    }

    newsletterStore.state.fetchingConfigs = true;

    const response = await getUnidyClient().newsletters.listNewsletters();

    newsletterStore.state.fetchingConfigs = false;

    if (response.success && response.data?.newsletters) {
      newsletterStore.state.newsletterConfigs = response.data.newsletters;
    }
  }

  static async fetchSubscriptions(): Promise<void> {
    const { preferenceToken } = newsletterStore.state;

    if (!preferenceToken) {
      return;
    }

    newsletterStore.state.fetchingSubscriptions = true;

    const response = await getUnidyClient().newsletters.listSubscriptions({
      preferenceToken,
    });

    newsletterStore.state.fetchingSubscriptions = false;

    if (response.status === 401) {
      Flash.error.addMessage(t("newsletter.errors.invalid_preference_token"));
      return;
    }

    if (response.success && response.data) {
      newsletterStore.state.existingSubscriptions = response.data.map(
        (sub): ExistingSubscription => ({
          newsletter_internal_name: sub.newsletter_internal_name,
          confirmed: sub.confirmed_at !== null,
        }),
      );

      const preferenceToken = response.data.find((sub) => sub.preference_token)?.preference_token;
      if (preferenceToken) {
        // TODO: implement proper coupling between newsletter and auth
        //newsletterStore.state.preferenceToken = preferenceToken;
      }

      console.log("existingSubscriptions fetch", newsletterStore.state.existingSubscriptions);
    }
  }

  static async subscribeToNewsletter(internalName: string, email: string): Promise<boolean> {
    newsletterStore.state.loading = true;

    const [error, response] = await getUnidyClient().newsletters.createSubscriptions({
      email,
      newsletter_subscriptions: [
        {
          newsletter_internal_name: internalName,
          preference_identifiers: [],
        },
      ],
      return_to_after_confirmation: NewsletterHelpers.returnToAfterConfirmationUrl(),
    });

    newsletterStore.state.loading = false;

    if (error) {
      if (error === "newsletter_error") {
        const errors = response.data?.errors || [];
        const alreadySubscribed = errors.some((err) => err.error_identifier === "already_subscribed");

        if (alreadySubscribed) {
          await NewsletterHelpers.sendLoginEmail(email);
          return false;
        }

        const firstError = errors[0];
        if (firstError) {
          newsletterStore.state.errors = {
            [firstError.newsletter_internal_name]: firstError.error_identifier as NewsletterErrorIdentifier,
          };
          Flash.error.addMessage(t(`newsletter.errors.${firstError.error_identifier}`) || t("newsletter.errors.unknown"));
        }
      } else {
        Flash.error.addMessage(t(`newsletter.errors.${error}`) || t("newsletter.errors.unknown"));
      }
      return false;
    }

    // Add to existing subscriptions if we have a preference token
    if (newsletterStore.state.preferenceToken) {
      newsletterStore.state.existingSubscriptions = [
        ...newsletterStore.state.existingSubscriptions,
        { newsletter_internal_name: internalName, confirmed: false },
      ];
    }

    return true;
  }

  static async deleteSubscription(internalName: string): Promise<boolean> {
    const { preferenceToken } = newsletterStore.state;

    if (!preferenceToken) {
      return false;
    }

    newsletterStore.state.loading = true;

    const response = await getUnidyClient().newsletters.deleteSubscription(internalName, {
      preferenceToken,
    });

    newsletterStore.state.loading = false;

    if (response.status === 200 && response.data?.new_preference_token) {
      newsletterStore.state.preferenceToken = response.data.new_preference_token;
      persist("preferenceToken");
      newsletterStore.state.existingSubscriptions = newsletterStore.state.existingSubscriptions.filter(
        (sub) => sub.newsletter_internal_name !== internalName,
      );
      return true;
    }

    if (response.status === 204) {
      NewsletterHelpers.logout();
      newsletterStore.state.checkedNewsletters = [];
      return true;
    }

    if (response.status === 401) {
      Flash.error.addMessage(t("newsletter.errors.invalid_preference_token"));
      return false;
    }

    if (response.status === 422) {
      Flash.error.addMessage(t("newsletter.errors.unsubscribe_failed"));
    } else {
      Flash.error.addMessage(t("newsletter.errors.unknown"));
    }

    return false;
  }

   static async createSubscriptions({ email, checkedNewsletters }) {
    const [error, response] = await getUnidyClient().newsletters.createSubscriptions({
      email,
      newsletter_subscriptions: checkedNewsletters.map((newsletter) => ({
        newsletter_internal_name: newsletter,
        preference_identifiers: [],
      })),
      return_to_after_confirmation: NewsletterHelpers.returnToAfterConfirmationUrl(),
    });

    newsletterStore.state.loading = false;

    if (error) {
      switch (error) {
        case "newsletter_error": {
          const errors = response.data?.errors || [];
          const alreadySubscribed = errors.some((err) => err.error_identifier === "already_subscribed");

          if (alreadySubscribed) {
            await NewsletterHelpers.sendLoginEmail(email);
            return;
          }

          const errorMap: Record<string, NewsletterErrorIdentifier> = {};
          for (const err of errors) {
            errorMap[err.newsletter_internal_name] = err.error_identifier as NewsletterErrorIdentifier;
          }
          newsletterStore.state.errors = errorMap;

        }
        case "rate_limit_exceeded":
        case "network_error":
        case "server_error":
          Flash.error.addMessage(t(`newsletter.errors.${error}`));
          break;
        default:
          Flash.error.addMessage(t("newsletter.errors.unknown"));
          break;
      }
      return;
    }

    const newsletterNames = checkedNewsletters.map(
      (internalName) => NewsletterHelpers.getNewsletterTitle(internalName) || internalName
    );
    Flash.success.addMessage(t("newsletter.subscribe_success", { newsletterName: newsletterNames.join(", ") }));
  }


  static getNewsletterTitle(internalName: string): string | undefined {
    const config = newsletterStore.state.newsletterConfigs.find(
      (n) => n.internal_name === internalName
    );
    return config?.title;
  }

  static getSubscription(internalName: string): ExistingSubscription | undefined {
    return newsletterStore.state.existingSubscriptions.find(
      (sub) => sub.newsletter_internal_name === internalName
    );
  }

  static isSubscribed(internalName: string): boolean {
    return newsletterStore.state.existingSubscriptions.some(
      (sub) => sub.newsletter_internal_name === internalName
    );
  }

  static isConfirmed(internalName: string): boolean {
    const sub = NewsletterHelpers.getSubscription(internalName);
    return sub?.confirmed ?? false;
  }

  private static returnToAfterConfirmationUrl(): string {
    const baseUrl = `${location.origin}${location.pathname}`;
    const params = new URLSearchParams(location.search);
    for (const key of ["email", "selected", "newsletter_error"]) {
      params.delete(key);
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

}
