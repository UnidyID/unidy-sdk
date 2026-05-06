import { createStore } from "@stencil/store";

export type NewsletterErrorIdentifier =
  | "unconfirmed"
  | "already_subscribed"
  | "consent_required"
  | "invalid_email"
  | "newsletter_not_found"
  | "preferences_not_found"
  | "invalid_preference_token"
  | "internal_server_error"
  | "user_validation_error"
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

export interface AdditionalFieldNode {
  value?: string | string[];
  type?: string;
}
export type AdditionalFieldsData = Record<string, AdditionalFieldNode>;
export type NewsletterConsentMap = Record<string, boolean>;

interface NewsletterState {
  email: string;
  preferenceToken: string;
  checkedNewsletters: CheckedNewsletters;
  defaultPreferences: DefaultPreferences;
  additionalFields: AdditionalFieldsData;
  additionalFieldErrors: Record<string, string>;

  fetchingSubscriptions: boolean;
  existingSubscriptions: ExistingSubscription[];

  errors: Record<string, NewsletterErrorIdentifier>;
  consentGiven: NewsletterConsentMap;
  consentRequired: NewsletterConsentMap;

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
  additionalFields: {},
  additionalFieldErrors: {},

  fetchingSubscriptions: false,
  existingSubscriptions: [],

  errors: {},
  consentGiven: {},
  consentRequired: {},

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
  const consentRequired = { ...newsletterStore.state.consentRequired };
  newsletterStore.state = initialState;
  newsletterStore.state.consentRequired = consentRequired;
  newsletterStore.state.consentGiven = Object.fromEntries(Object.keys(consentRequired).map((key) => [key, false]));
};

export const hasAllRequiredConsent = (state: Pick<NewsletterState, "consentGiven" | "consentRequired">): boolean => {
  const requiredConsentKeys = Object.keys(state.consentRequired).filter((key) => state.consentRequired[key]);
  return requiredConsentKeys.every((key) => state.consentGiven[key]);
};
