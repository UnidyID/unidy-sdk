import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";
import { newsletterStore } from "../../store/newsletter-store";
import { getParentNewsletterRoot } from "../helpers";

export type NewsletterButtonFor = "login" | "create";

export const newsletterContext: SubmitButtonContext<NewsletterButtonFor> = {
  handleClick: async (event: MouseEvent, el: HTMLElement, forProp?: NewsletterButtonFor) => {
    event.preventDefault();
    return await getParentNewsletterRoot(el)?.submit(forProp);
  },

  isDisabled(forProp, disabled?: boolean): boolean {
    if (forProp === "login") {
      return disabled || !newsletterStore.state.email;
    }

    return disabled || !newsletterStore.state.email || Object.keys(newsletterStore.state.checkedNewsletters).length === 0;
  },

  isLoading(): boolean {
    return false;
  },
};
