import { getUnidyClient } from "../api";
import { Flash } from "../shared/store/flash-store";
import { t } from "../i18n";
import { newsletterStore, type NewsletterErrorIdentifier } from "./store/newsletter-store";


export class NewsletterHelpers {
  static returnToAfterConfirmationUrl(): string {
    const baseUrl = `${location.origin}${location.pathname}`;
    const params = new URLSearchParams(location.search);
    for (const key of ["email", "selected", "newsletter_error"]) {
      params.delete(key);
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  static async sendLoginEmail(email: string): Promise<void> {
    const response = await getUnidyClient().newsletters.sendLoginEmail({
      email,
      redirect_uri: NewsletterHelpers.returnToAfterConfirmationUrl(),
    });

    if (response.status === 200) {
      Flash.success.addMessage(t("newsletter.login_email_sent"));
    }
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
          const errorMap: Record<string, NewsletterErrorIdentifier> = {};
          const errors = response.data?.errors || [];

          const hasAlreadySubscribed = errors.some((err) => err.error_identifier === "already_subscribed");

          if (hasAlreadySubscribed) {
            await NewsletterHelpers.sendLoginEmail(email);
            return;
          }

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

    Flash.success.addMessage(t("newsletter.subscribe_success"));
  }
}
