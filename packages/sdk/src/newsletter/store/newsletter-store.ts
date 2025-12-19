import { createStore } from "@stencil/store";

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

  fetchingSubscriptions: boolean;
  existingSubscriptions: ExistingSubscription[];

  errors: Record<string, NewsletterErrorIdentifier>;

  isAuthenticated: boolean;
}

const PERSIST_KEY_PREFIX = "unidy_newsletter_";

export const persist = (key: "email" | "preferenceToken") => {
  sessionStorage.setItem(`${PERSIST_KEY_PREFIX}${key}`, newsletterStore.state[key]);
};

const getPersistedValue = (key: "email" | "preferenceToken") => {
  return sessionStorage.getItem(`${PERSIST_KEY_PREFIX}${key}`);
};

const initialState: NewsletterState = {
  email: getPersistedValue("email") ?? "",
  preferenceToken: getPersistedValue("preferenceToken") ?? "",
  checkedNewsletters: [],

  fetchingSubscriptions: false,
  existingSubscriptions: [],

  errors: {},
  isAuthenticated: false,
};

export const newsletterStore = createStore<NewsletterState>(initialState);

export const reset = () => {
  sessionStorage.removeItem(`${PERSIST_KEY_PREFIX}preferenceToken`);
  sessionStorage.removeItem(`${PERSIST_KEY_PREFIX}email`);
  newsletterStore.state = initialState;
};
