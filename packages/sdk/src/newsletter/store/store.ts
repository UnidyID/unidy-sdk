import { createStore } from "@stencil/store";

const store = createStore({
  email: "",
  checkedNewsletters: [],
});

class NewsletterStore {
  get state() {
    return store.state;
  }

  setEmail(email: string) {
    store.state.email = email;
  }
}

export const newsletterStore = new NewsletterStore();
export default newsletterStore;
