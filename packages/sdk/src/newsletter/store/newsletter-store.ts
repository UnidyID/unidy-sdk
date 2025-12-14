import { createStore } from "@stencil/store";
import type { Newsletter } from "../api/newsletters";

export type NewsletterErrorIdentifier =
  | "unconfirmed"
  | "already_subscribed"
  | "invalid_email"
  | "newsletter_not_found"
  | "preferences_not_found"
  | "unknown";

interface NewsletterState {
  email: string;
  preferenceToken: string;
  loading: boolean;
  fetchingSubscriptions: boolean;
  fetchingConfigs: boolean;

  newsletterConfigs: Newsletter[];
  checkedNewsletters: string[];
  existingSubscriptions: string[];
  errors: Record<string, NewsletterErrorIdentifier>;
  showSuccess: boolean;
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
  loading: false,
  fetchingSubscriptions: false,
  fetchingConfigs: false,

  newsletterConfigs: [],
  checkedNewsletters: [],
  existingSubscriptions: [],
  errors: {},

  showSuccess: false,
};

export const newsletterStore = createStore<NewsletterState>(initialState);

export const resetErrors = () => {
  newsletterStore.state.errors = {};
};

export const reset = () => {
  newsletterStore.state = initialState;
  localStorage.removeItem(`${PERSIST_KEY_PREFIX}preferenceToken`);
  localStorage.removeItem(`${PERSIST_KEY_PREFIX}email`);
};

export const clearPreferenceToken = () => {
  newsletterStore.state.preferenceToken = "";
  newsletterStore.state.email = "";
  newsletterStore.state.existingSubscriptions = [];
  localStorage.removeItem(`${PERSIST_KEY_PREFIX}preferenceToken`);
  localStorage.removeItem(`${PERSIST_KEY_PREFIX}email`);
};