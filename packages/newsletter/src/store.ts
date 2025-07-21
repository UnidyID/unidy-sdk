import { createStore } from "@stencil/store";

export const newsletterStore = createStore({
  email: "",
  checkedNewsletters: [],
});

export default newsletterStore;
