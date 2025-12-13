import { createStore } from "@stencil/store";

const store = createStore({
  email: "",
  checkedNewsletters: [],
});

const newsletterStoreOnChange: <K extends keyof typeof store.state>(prop: K, cb: (value: typeof store.state[K]) => void) => () => void = store.onChange;

class NewsletterStore {
  get state() {
    return store.state;
  }

  get<K extends keyof typeof store.state>(key: K): typeof store.state[K] {
    return store.state[key];
  }

  set<K extends keyof typeof store.state>(key: K, value: typeof store.state[K]): void {
    store.state[key] = value;
  }

  setEmail(email: string) {
    store.state.email = email;
  }

  onChange<K extends keyof typeof store.state>(prop: K, cb: (value: typeof store.state[K]) => void): () => void {
    return newsletterStoreOnChange(prop, cb);
  }
}

export const newsletterStore = new NewsletterStore();
export default newsletterStore;
export { newsletterStoreOnChange as onChange };
