import { createStore } from "@stencil/store";
import type { Newsletter } from "../api/newsletters";

export type NewsletterErrorIdentifier =
  | "unconfirmed"
  | "already_subscribed"
  | "invalid_email"
  | "newsletter_not_found"
  | "preferences_not_found"
  | "unknown";

export interface ExistingSubscription {
  newsletter_internal_name: string;
  confirmed: boolean;
}

interface NewsletterState {
  email: string;
  preferenceToken: string;
  checkedNewsletters: string[];
  loading: boolean;

  fetchingSubscriptions: boolean;
  existingSubscriptions: ExistingSubscription[];
  resendingDoi: string[];

  fetchingConfigs: boolean;
  newsletterConfigs: Newsletter[];

  errors: Record<string, NewsletterErrorIdentifier>;
}

const PERSIST_KEY_PREFIX = "unidy_newsletter_";

export const persist = (key: 'email' | 'preferenceToken') => {
  localStorage.setItem(`${PERSIST_KEY_PREFIX}${key}`, newsletterStore.state[key]);
};

const getPersistedValue = (key: 'email' | 'preferenceToken') => {
  return localStorage.getItem(`${PERSIST_KEY_PREFIX}${key}`);
}

const initialState: NewsletterState = {
  email: getPersistedValue("email") ?? "",
  preferenceToken: getPersistedValue("preferenceToken") ?? "",
  checkedNewsletters: [],
  loading: false,

  fetchingSubscriptions: false,
  existingSubscriptions: [],
  resendingDoi: [],

  fetchingConfigs: false,
  newsletterConfigs: [],

  errors: {},
};

export const newsletterStore = createStore<NewsletterState>(initialState);

export const reset = () => {
  newsletterStore.state = initialState;
  localStorage.removeItem(`${PERSIST_KEY_PREFIX}preferenceToken`);
  localStorage.removeItem(`${PERSIST_KEY_PREFIX}email`);
};