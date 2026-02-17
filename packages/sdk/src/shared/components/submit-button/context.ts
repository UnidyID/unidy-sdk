export interface SubmitButtonContext<ForContext = string> {
  init?(): Promise<void>;
  handleClick(event: MouseEvent, element: HTMLElement, forProp?: ForContext): Promise<void>;
  isDisabled(forProp?: ForContext, disabled?: boolean): boolean;
  isLoading(): boolean;
  getButtonText?(forProp?: ForContext, text?: string): string;
  shouldRender?(forProp?: ForContext): boolean;
}

export const defaultContext: SubmitButtonContext = {
  async handleClick() {},

  isDisabled(_forProp, disabled = false): boolean {
    return disabled || false;
  },

  isLoading(): boolean {
    return false;
  },
};
