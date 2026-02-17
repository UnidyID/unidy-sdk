import { Component, Element, Event, type EventEmitter, Host, h, Method, Prop } from "@stencil/core";
import { Auth } from "../../../auth/auth";
import { t } from "../../../i18n";
import { logger } from "../../../logger";
import { UnidyComponent } from "../../../shared/base/component";
import { Flash } from "../../../shared/store/flash-store";
import { waitForConfig } from "../../../shared/store/unidy-store";
import { clearUrlParam } from "../../../shared/utils/url-utils";
import * as NewsletterHelpers from "../../newsletter-helpers";
import { type NewsletterErrorIdentifier, newsletterStore, persist } from "../../store/newsletter-store";
import type { NewsletterButtonFor } from "../submit-button/newsletter-submit-button";

@Component({
  tag: "u-newsletter-root",
  shadow: false,
})
export class NewsletterRoot extends UnidyComponent() {
  @Element() el!: HTMLElement;
  /** CSS classes to apply to the host element. */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /** Fired on successful newsletter subscription. Contains the email and subscribed newsletters. */
  @Event() uNewsletterSuccess!: EventEmitter<{ email: string; newsletters: string[] }>;
  /** Fired on newsletter subscription failure. Contains the email and error code. */
  @Event() uNewsletterError!: EventEmitter<{ email: string; error: string }>;

  getErrorText(errorIdentifier: NewsletterErrorIdentifier): string {
    return t(`newsletter.errors.${errorIdentifier}`) || t("errors.unknown", { defaultValue: "An unknown error occurred" });
  }

  async componentWillLoad() {
    const newsletterError = clearUrlParam("newsletter_error");
    const preferenceToken = clearUrlParam("preference_token");
    const email = clearUrlParam("email");

    if (newsletterError) {
      Flash.error.addMessage(this.getErrorText(newsletterError as NewsletterErrorIdentifier));
    }

    if (preferenceToken && email) {
      newsletterStore.state.preferenceToken = preferenceToken;
      newsletterStore.state.email = email;

      persist("preferenceToken");
      persist("email");
    }

    const authInstance = await Auth.getInstance();
    const isAuthenticated = await authInstance.isAuthenticated();
    newsletterStore.state.isAuthenticated = isAuthenticated;

    if (isAuthenticated) {
      const userData = await authInstance.userTokenPayload();

      if (userData) {
        newsletterStore.state.email = userData.email;
      }
    }

    await waitForConfig();
    await NewsletterHelpers.fetchSubscriptions();
  }

  @Method()
  async submit(forType?: NewsletterButtonFor) {
    const { email, checkedNewsletters, consentGiven, consentRequired } = newsletterStore.state;
    const newsletters = Object.keys(checkedNewsletters);

    // Check email first for better UX
    if (!email) {
      logger.error("Email is required");
      Flash.error.addMessage(t("newsletter.errors.email_required"));
      this.uNewsletterError.emit({ email: "", error: "email_required" });
      return;
    }

    if (forType === "login") {
      const result = await NewsletterHelpers.sendLoginEmail(email);
      if (result.success === true) {
        this.uNewsletterSuccess.emit({ email, newsletters: [] });
      } else if (result.success === false) {
        this.uNewsletterError.emit({ email, error: `login_${result.error}` });
      }
      return;
    }

    if (newsletters.length === 0) {
      logger.error("No newsletters selected: please select at least one newsletter");
      this.uNewsletterError.emit({ email, error: "no_newsletters_selected" });
      return;
    }

    if (consentRequired && !consentGiven) {
      newsletterStore.state.errors = {
        ...newsletterStore.state.errors,
        consent: "consent_required",
      };
      this.uNewsletterError.emit({ email, error: "consent_required" });
      return;
    }

    const success = await NewsletterHelpers.createSubscriptions({ email });

    if (success) {
      this.uNewsletterSuccess.emit({ email, newsletters });
    } else {
      this.uNewsletterError.emit({ email, error: "subscription_failed" });
    }
  }

  render() {
    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
