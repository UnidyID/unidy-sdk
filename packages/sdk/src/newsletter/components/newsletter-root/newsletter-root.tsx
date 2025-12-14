import { Component, Host, h, Prop, Element, Method } from "@stencil/core";
import { newsletterStore, resetErrors, type NewsletterErrorIdentifier } from "../../store/newsletter-store";
import { authStore } from "../../../auth/store/auth-store";
import { NewsletterHelpers } from "../../newsletter-helpers";
import { clearUrlParam } from "../../../shared/component-utils";
import { t } from "../../../i18n";

@Component({
  tag: "u-newsletter-root",
  shadow: false,
})
export class NewsletterRoot {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName = "";

  getErrorText(errorIdentifier: NewsletterErrorIdentifier): string {
    return t(`newsletter.errors.${errorIdentifier}`) || t("newsletter.errors.unknown");
  }

  componentWillLoad() {
    const preferenceToken = clearUrlParam("preference_token");
    if (preferenceToken) {
      newsletterStore.state.preferenceToken = preferenceToken;
      newsletterStore.state.loggedInViaEmail = true;
    }
  }


  @Method()
  async submit() {
    resetErrors();

    newsletterStore.state.loading = true;
    newsletterStore.state.showSuccess = false;

    const { email, checkedNewsletters } = newsletterStore.state;

    if (checkedNewsletters.length === 0) {
      console.error("No newsletters selected: please select at least one newsletter");
      newsletterStore.state.loading = false;
      return;
    }

    await NewsletterHelpers.createSubscriptions({ email, checkedNewsletters: checkedNewsletters });
  }

  componentWillRender() {
    if (authStore.state.email && !newsletterStore.state.email) {
      newsletterStore.state.email = authStore.state.email;
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
