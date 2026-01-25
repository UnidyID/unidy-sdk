import type { BaseModel } from "./index";

export interface NewsletterSubscription extends BaseModel {
  confirmed_at: string | null;
  email: string;
  opted_out_at: string | null;
  preference_token: string;
  user_id: number | null;
  newsletter_id: number;
}
