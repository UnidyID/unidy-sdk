import type { AuthButtonFor } from "./auth-submit-button";

export interface SubmitButtonContext {
  init?(): Promise<void>;
  handleClick(event: MouseEvent, el: HTMLElement): Promise<any>;
  isDisabled(forProp?: AuthButtonFor, disabled?: boolean): boolean;
  isLoading(): boolean;
  getButtonText?(forProp?: AuthButtonFor, text?: string): string;
  shouldRender?(forProp?: AuthButtonFor): boolean;
}

export const defaultContext: SubmitButtonContext = {
  async handleClick() {
  },

  isDisabled(_forProp, disabled?: boolean): boolean {
    return disabled || false;
  },

  isLoading(): boolean {
    return false;
  },
};

