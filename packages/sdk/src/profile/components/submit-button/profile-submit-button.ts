import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";
import { findParentProfile } from "../../../shared/context-utils";
import { state as profileState } from "../../store/profile-store";

export const profileContext: SubmitButtonContext = {
  async handleClick(event: MouseEvent, el: HTMLElement, _forProp?: string) {
    event.preventDefault();
    await findParentProfile(el)?.submitProfile();
  },

  isDisabled(_forProp, disabled?: boolean): boolean {
    return disabled || (profileState.errors && Object.keys(profileState.errors).length > 0) || profileState.phoneValid === false;
  },

  isLoading(): boolean {
    return profileState.loading;
  },
};
