import { Component, Prop, h } from "@stencil/core";
import newsletterStore from "../../store";
import { UnidyClient, NewsletterSubscription, NewsletterSubscriptionError } from "@unidy.io/sdk-api-client";

@Component({
  tag: "submit-button",
  shadow: true,
})
export class SubmitButton {
  @Prop() title: string;
  @Prop() apiUrl: string;
  @Prop() apiKey: string;

  private client: UnidyClient;

  componentWillLoad() {
    this.client = new UnidyClient(this.apiUrl, this.apiKey);
  }

  private submit = async () => {
    console.log("submit");

    console.log(newsletterStore.get("email"));
    console.log(newsletterStore.get("checkedNewsletters"));

    const payload = {
      email: newsletterStore.get("email"),
      newsletter_subscriptions: newsletterStore.get("checkedNewsletters").map((newsletter) => ({
        newsletter_internal_name: newsletter,
        preference_identifiers: [],
      })),
    };

    const [error, response] = await this.client.newsletters.createSubscriptions(payload);

    if (error) {
      console.error(error);
    } else {
      console.log(response);
    }
  };

  render() {
    return (
      <button type="button" onClick={this.submit}>
        {this.title}
      </button>
    );
  }
}
