import { Component, Host, h, Prop, Element, Method } from "@stencil/core";
import { newsletterStore, resetErrors, type NewsletterErrorIdentifier } from "../../store/newsletter-store";
import { getUnidyClient } from "../../../api";
import { authStore } from "../../../auth/store/auth-store";
import { Flash } from "../../../shared/store/flash-store";
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

  private buildReturnUrl(): string {
    const baseUrl = `${location.origin}${location.pathname}`;
    const params = new URLSearchParams(location.search);
    for (const key of ["email", "selected", "newsletter_error"]) {
      params.delete(key);
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
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

    const [error, response] = await getUnidyClient().newsletters.createSubscriptions({
      email,
      newsletter_subscriptions: checkedNewsletters.map((newsletter) => ({
        newsletter_internal_name: newsletter,
        preference_identifiers: [],
      })),
      return_to_after_confirmation: this.buildReturnUrl(),
    });

    newsletterStore.state.loading = false;

    if (error) {
      switch (error) {
        case "newsletter_error": {
          const errorMap: Record<string, NewsletterErrorIdentifier> = {};

          for (const err of response.data?.errors || []) {
            errorMap[err.newsletter_internal_name] = err.error_identifier as NewsletterErrorIdentifier;
          }
          newsletterStore.state.errors = errorMap;
          break;
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
