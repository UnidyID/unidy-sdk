import { type FunctionalComponent } from "@stencil/core";
import { newsletterStore } from "../../store/newsletter-store";
import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";
import { getParentNewsletterRoot } from "../helpers";

export interface NewsletterSubmitButtonProps {
  onClick?: (event: MouseEvent) => void;
}

export const NewsletterSubmitButton: FunctionalComponent<NewsletterSubmitButtonProps> = (_props, children) => {
  return children;
};

export const newsletterContext: SubmitButtonContext = {
  handleClick: async (event: MouseEvent, el: HTMLElement) => {
    event.preventDefault();
    return await getParentNewsletterRoot(el)?.submit();
  },

  isDisabled(_forProp, disabled?: boolean): boolean {
    return disabled || !newsletterStore.get("email");
  },

  isLoading(): boolean {
    // newsletter sdk doesn't have loading state yet
    return false;
  },
};
