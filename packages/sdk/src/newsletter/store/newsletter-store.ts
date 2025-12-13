import { createStore } from "@stencil/store";

interface NewsletterState {
  email: string;
  checkedNewsletters: string[];
}

const initialState: NewsletterState = {
  email: "",
  checkedNewsletters: [],
};

export const newsletterStore = createStore<NewsletterState>(initialState);
