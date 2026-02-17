import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";
import { findParentProfile } from "../../../shared/context-utils";
import { hasProfileChanged } from "../../profile-helpers";
import { state as profileState } from "../../store/profile-store";

export const profileContext: SubmitButtonContext = {
  async handleClick(event: MouseEvent, element: HTMLElement, _forProp?: string) {
    event.preventDefault();
    profileState.activeField = null;

    await findParentProfile(element)?.submitProfile();
  },

  isDisabled(_forProp, disabled?: boolean): boolean {
    return (
      disabled ||
      !hasProfileChanged() ||
      (profileState.errors && Object.keys(profileState.errors).length > 0) ||
      profileState.phoneValid === false
    );
  },

  isLoading(): boolean {
    return profileState.loading;
  },
};
