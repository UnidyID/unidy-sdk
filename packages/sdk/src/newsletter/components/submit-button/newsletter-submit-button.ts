import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";
import { findParentNewsletterRoot } from "../../../shared/context-utils";
import { newsletterStore } from "../../store/newsletter-store";

export type NewsletterButtonFor = "login" | "create";

export const newsletterContext: SubmitButtonContext<NewsletterButtonFor> = {
  handleClick: async (event: MouseEvent, element: HTMLElement, forProp?: NewsletterButtonFor) => {
    event.preventDefault();
    return await findParentNewsletterRoot(element)?.submit(forProp);
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
