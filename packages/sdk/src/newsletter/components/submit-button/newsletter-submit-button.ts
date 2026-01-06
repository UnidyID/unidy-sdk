import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";
import { newsletterStore } from "../../store/newsletter-store";
import { getParentNewsletterRoot } from "../helpers";

export type NewsletterButtonFor = "login" | "create";

export const newsletterContext: SubmitButtonContext<NewsletterButtonFor> = {
  handleClick: async (event: MouseEvent, el: HTMLElement) => {
    event.preventDefault();
    const forAttr = el.closest("u-submit-button")?.getAttribute("for") as NewsletterButtonFor | null;
    return await getParentNewsletterRoot(el)?.submit(forAttr === "login" ? "login" : undefined);
  },

  isDisabled(forProp, disabled?: boolean): boolean {
    if (forProp === "login") {
      return disabled || !newsletterStore.state.email;
    }

    return disabled || !newsletterStore.state.email || Object.keys(newsletterStore.state.checkedNewsletters).length === 0;
  },

  isLoading(): boolean {
    // newsletter sdk doesn't have loading state yet
    return false;
  },
};
