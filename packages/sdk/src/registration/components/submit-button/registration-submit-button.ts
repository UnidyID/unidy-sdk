import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";
import { registrationState } from "../../store/registration-store";
import { getParentRegistrationStep } from "../helpers";

export const registrationContext: SubmitButtonContext = {
  async handleClick(event: MouseEvent, element: HTMLElement) {
    event.preventDefault();
    (await getParentRegistrationStep(element))?.submit();
  },

  isDisabled(_forProp, disabled?: boolean): boolean {
    return disabled || registrationState.loading || registrationState.submitting;
  },

  isLoading(): boolean {
    return registrationState.loading || registrationState.submitting;
  },
};
