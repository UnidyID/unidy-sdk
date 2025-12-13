import { type FunctionalComponent } from "@stencil/core";
import { newsletterStore } from "../../store/newsletter-store";
import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";

export interface NewsletterSubmitButtonProps {
  onClick?: (event: MouseEvent) => void;
}

export const NewsletterSubmitButton: FunctionalComponent<NewsletterSubmitButtonProps> = (_props, children) => {
  return children;
};

export const newsletterContext: SubmitButtonContext = {
  handleClick: async () => {
    // TODO
    console.log("TODO: Implement newsletter submit logic")
  },

  isDisabled(_forProp, disabled?: boolean): boolean {
    return disabled || !newsletterStore.get("email");
  },

  isLoading(): boolean {
    // newsletter sdk doesn't have loading state yet
    return false;
  },
};
