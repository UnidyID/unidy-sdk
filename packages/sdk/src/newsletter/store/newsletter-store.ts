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
  checkedNewsletters: string[];
  loading: boolean;

  errors: Record<string, NewsletterErrorIdentifier>;
  showSuccess: boolean;
  resendingDoi: string[];

  newsletterLabels: Record<string, string>;
}

const initialState: NewsletterState = {
  email: "",
  checkedNewsletters: [],
  loading: false,
  errors: {},

  showSuccess: false,
  resendingDoi: [],

  newsletterLabels: {},
};

export const newsletterStore = createStore<NewsletterState>(initialState);

export const resetErrors = () => {
  newsletterStore.state.errors = {};
};

export const reset = () => {
  newsletterStore.state = initialState;
};
