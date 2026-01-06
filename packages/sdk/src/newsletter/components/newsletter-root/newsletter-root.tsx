import { Component, Element, Host, h, Method, Prop } from "@stencil/core";
import { Auth } from "../../../auth/auth";
import { t } from "../../../i18n";
import { logger, UnidyComponent } from "../../../logger";
import { clearUrlParam } from "../../../shared/component-utils";
import { Flash } from "../../../shared/store/flash-store";
import { waitForConfig } from "../../../shared/store/unidy-store";
import * as NewsletterHelpers from "../../newsletter-helpers";
import { type NewsletterErrorIdentifier, newsletterStore, persist } from "../../store/newsletter-store";
import type { NewsletterButtonFor } from "../submit-button/newsletter-submit-button";

@Component({
  tag: "u-newsletter-root",
  shadow: false,
})
export class NewsletterRoot extends UnidyComponent {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName = "";

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
      const userData = await authInstance.userData();

      if (userData) {
        newsletterStore.state.email = userData.email;
      }
    }

    await waitForConfig();
    await NewsletterHelpers.fetchSubscriptions();
  }

  @Method()
  async submit(forType?: NewsletterButtonFor) {
    const { email, checkedNewsletters } = newsletterStore.state;

    if (forType === "login") {
      if (!email) {
        Flash.error.addMessage(t("newsletter.errors.emailRequired", { defaultValue: "Email is required for login" }));
        return;
      }
      return await NewsletterHelpers.sendLoginEmail(email);
    }

    if (Object.keys(checkedNewsletters).length === 0) {
      logger.error("No newsletters selected: please select at least one newsletter");
      return;
    }

    await NewsletterHelpers.createSubscriptions({ email });
  }

  render() {
    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
