import { createStore } from "@stencil/store";

export type NewsletterErrorIdentifier =
  | "unconfirmed"
  | "already_subscribed"
  | "consent_required"
  | "invalid_email"
  | "newsletter_not_found"
  | "preferences_not_found"
  | "invalid_preference_token"
  | "unknown";

export type NewsletterInternalName = string;
export type PreferenceIdentifier = string;

export interface ExistingSubscription {
  newsletter_internal_name: NewsletterInternalName;
  confirmed: boolean;
  preference_identifiers: PreferenceIdentifier[];
}

export type CheckedNewsletters = Record<NewsletterInternalName, PreferenceIdentifier[]>;

export type DefaultPreferences = Record<NewsletterInternalName, Set<PreferenceIdentifier>>;

interface NewsletterState {
  email: string;
  preferenceToken: string;
  checkedNewsletters: CheckedNewsletters;
  defaultPreferences: DefaultPreferences;

  fetchingSubscriptions: boolean;
  existingSubscriptions: ExistingSubscription[];

  errors: Record<string, NewsletterErrorIdentifier>;
  consentGiven: boolean;

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
  checkedNewsletters: {},
  defaultPreferences: {},

  fetchingSubscriptions: false,
  existingSubscriptions: [],

  errors: {},
  consentGiven: false,

  isAuthenticated: false,
};

export const newsletterStore = createStore<NewsletterState>(initialState);

export const storeDefaultPreference = (internalName: NewsletterInternalName, preferenceIdentifier: PreferenceIdentifier) => {
  const current = newsletterStore.state.defaultPreferences[internalName] ?? new Set();
  const updated = new Set(current);
  updated.add(preferenceIdentifier);
  newsletterStore.state.defaultPreferences = {
    ...newsletterStore.state.defaultPreferences,
    [internalName]: updated,
  };
};

export const reset = () => {
  sessionStorage.removeItem(`${PERSIST_KEY_PREFIX}preferenceToken`);
  sessionStorage.removeItem(`${PERSIST_KEY_PREFIX}email`);
  newsletterStore.state = initialState;
};
