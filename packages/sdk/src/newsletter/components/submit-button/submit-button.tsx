import { Component, Prop, h, Event, type EventEmitter } from "@stencil/core";
import newsletterStore from "../../store/store";
import { UnidyClient } from "../../../api";
import type { CreateSubscriptionsResponse, CreateSubscriptionsResult } from "../../api/newsletters";

@Component({
  tag: "submit-button",
  shadow: false,
})
export class SubmitButton {
  @Prop() apiUrl: string;
  @Prop() apiKey: string;
  @Prop() className: string;

  @Event() success: EventEmitter<CreateSubscriptionsResponse>;
  @Event() error: EventEmitter<CreateSubscriptionsResult[1]>;

  private client: UnidyClient;

  componentWillLoad() {
    this.client = new UnidyClient(this.apiUrl, this.apiKey);
  }

  private submit = async () => {
    if (!newsletterStore.get("email")) {
      return;
    }

    const payload = {
      email: newsletterStore.get("email"),
      newsletter_subscriptions: newsletterStore.get("checkedNewsletters").map((newsletter) => ({
        newsletter_internal_name: newsletter,
        preference_identifiers: [],
      })),
    };

    const [error, response] = await this.client.newsletters.createSubscriptions(payload);

    if (error) {
      this.error.emit(response);
    } else {
      this.success.emit(response.data);
    }
  };

  render() {
    return (
      <button type="button" onClick={this.submit} class={this.className} part="button">
        <slot />
      </button>
    );
  }
}
