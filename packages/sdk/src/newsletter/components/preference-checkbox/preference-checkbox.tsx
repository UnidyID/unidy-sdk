import { Component, h, Prop, State } from "@stencil/core";
import * as NewsletterHelpers from "../../newsletter-helpers";
import { type ExistingSubscription, newsletterStore, storeDefaultPreference } from "../../store/newsletter-store";

@Component({
  tag: "u-newsletter-preference-checkbox",
  shadow: false,
})
export class NewsletterPreferenceCheckbox {
  @Prop() internalName!: string;
  @Prop() preferenceIdentifier!: string;
  @Prop() checked = false;
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @State() loading = false;

  @State() existingSubscriptions: ExistingSubscription[] = [];
  @State() checkedPreferences: string[] = [];

  private storeUnsubscribe?: () => void;

  componentWillLoad() {
    this.subscribeToStore();
    this.initializeCheckedState();

    if (this.checked) {
      storeDefaultPreference(this.internalName, this.preferenceIdentifier);
    }
  }

  disconnectedCallback() {
    this.storeUnsubscribe?.();
  }

  private subscribeToStore() {
    this.storeUnsubscribe = newsletterStore.onChange("existingSubscriptions", (subscriptions) => {
      this.existingSubscriptions = subscriptions;
    });

    newsletterStore.onChange("checkedNewsletters", (checkedNewsletters) => {
      this.checkedPreferences = checkedNewsletters[this.internalName] || [];
    });

    this.existingSubscriptions = newsletterStore.state.existingSubscriptions;
    this.checkedPreferences = newsletterStore.state.checkedNewsletters[this.internalName] || [];
  }

  private initializeCheckedState() {
    if (NewsletterHelpers.isSubscribed(this.internalName)) {
      return;
    }

    if (this.checked) {
      this.syncToStore(true);
    }
  }

  private get subscription(): ExistingSubscription | undefined {
    return this.existingSubscriptions.find((sub) => sub.newsletter_internal_name === this.internalName);
  }

  private get isSubscribed(): boolean {
    return this.subscription !== undefined;
  }

  private get isConfirmed(): boolean {
    return this.subscription?.confirmed ?? false;
  }

  private get isDisabled(): boolean {
    return this.loading || (this.isSubscribed && !this.isConfirmed);
  }

  private get isChecked(): boolean {
    return this.checkedPreferences.includes(this.preferenceIdentifier);
  }

  private syncToStore(add: boolean) {
    const currentPreferences = newsletterStore.state.checkedNewsletters[this.internalName] || [];

    if (add) {
      if (!currentPreferences.includes(this.preferenceIdentifier)) {
        newsletterStore.set("checkedNewsletters", {
          ...newsletterStore.state.checkedNewsletters,
          [this.internalName]: [...currentPreferences, this.preferenceIdentifier],
        });
      }
    } else {
      newsletterStore.set("checkedNewsletters", {
        ...newsletterStore.state.checkedNewsletters,
        [this.internalName]: currentPreferences.filter((p) => p !== this.preferenceIdentifier),
      });
    }
  }

  private handleChange = async () => {
    if (this.isDisabled) return;

    const currentlyChecked = this.isChecked;
    this.syncToStore(!currentlyChecked);

    // If subscribed and confirmed persist the change to the API
    if (this.isSubscribed && this.isConfirmed) {
      this.loading = true;
      await NewsletterHelpers.updateSubscriptionPreferences(this.internalName);
      this.loading = false;
    }
  };

  render() {
    return (
      <input
        type="checkbox"
        checked={this.isChecked}
        disabled={this.isDisabled}
        onChange={this.handleChange}
        class={this.componentClassName}
        aria-checked={this.isChecked}
        aria-busy={this.loading}
        aria-disabled={this.isDisabled}
        data-internal-name={this.internalName}
        data-preference-identifier={this.preferenceIdentifier}
      />
    );
  }
}
