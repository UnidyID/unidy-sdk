import { Component, Prop, Element, Method, Host, h } from "@stencil/core";
import { newsletterStore, persist, type NewsletterErrorIdentifier } from "../../store/newsletter-store";
import * as NewsletterHelpers from "../../newsletter-helpers";
import { clearUrlParam } from "../../../shared/component-utils";
import { waitForConfig } from "../../../shared/store/unidy-store";
import { t } from "../../../i18n";
import { Auth } from "../../../auth/auth";

@Component({
  tag: "u-newsletter-root",
  shadow: false,
})
export class NewsletterRoot {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  getErrorText(errorIdentifier: NewsletterErrorIdentifier): string {
    return t(`newsletter.errors.${errorIdentifier}`) || t("errors.unknown", { defaultValue: "An unknown error occurred" });
  }

  async componentWillLoad() {
    const preferenceToken = clearUrlParam("preference_token");
    const email = clearUrlParam("email");

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
  async submit() {
    const { email, checkedNewsletters } = newsletterStore.state;

    if (checkedNewsletters.length === 0) {
      console.error("No newsletters selected: please select at least one newsletter");
      return;
    }

    await NewsletterHelpers.createSubscriptions({ email, checkedNewsletters: checkedNewsletters });
  }

  render() {
    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}
