import { createStore } from "@stencil/store";

export const newsletterStore = createStore({
  email: "",
  checkedNewsletters: [],
});

newsletterStore.onChange("email", (email) => {
  console.log("email changed", email);
});

export default newsletterStore;
