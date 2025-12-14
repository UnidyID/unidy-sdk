import { createStore } from "@stencil/store";

export type NewsletterErrorIdentifier =
  | "unconfirmed"
  | "already_subscribed"
  | "invalid_email"
  | "newsletter_not_found"
  | "preferences_not_found"
  | "unknown";

interface NewsletterState {
  email: string;
  preferenceToken: string
  loading: boolean;
  loggedInViaEmail: boolean;

  checkedNewsletters: string[];
  errors: Record<string, NewsletterErrorIdentifier>;
  showSuccess: boolean;

  newsletterLabels: Record<string, string>;
}

const initialState: NewsletterState = {
  email: "",
  preferenceToken: "",
  loading: false,
  loggedInViaEmail: false,

  checkedNewsletters: [],
  errors: {},

  showSuccess: false,

  newsletterLabels: {},
};

export const newsletterStore = createStore<NewsletterState>(initialState);

export const resetErrors = () => {
  newsletterStore.state.errors = {};
};

export const reset = () => {
  newsletterStore.state = initialState;
};
