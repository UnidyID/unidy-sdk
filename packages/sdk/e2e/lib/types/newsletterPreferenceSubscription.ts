import type { BaseModel } from "./index";

export interface NewsletterPreferenceSubscription extends BaseModel {
  newsletter_subscription_id: number;
  newsletter_preference_id: number;
}
