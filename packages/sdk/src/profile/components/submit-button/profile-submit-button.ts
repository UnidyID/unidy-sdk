import { type FunctionalComponent } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { Auth } from "../../../auth";
import { state as profileState } from "../../store/profile-store";
import { validateRequiredFieldsUnchanged, buildPayload } from "../../../shared/components/u-fields-submit-button-logic/submit-button-logic";
import { unidyState } from "../../../shared/store/unidy-store";
import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";

export interface ProfileSubmitButtonProps {}

export const ProfileSubmitButton: FunctionalComponent<ProfileSubmitButtonProps> = (_props, children) => {
  return children;
};

let authInstance: Auth | undefined;

export const profileContext: SubmitButtonContext = {
  async handleClick(event: MouseEvent, _el: HTMLElement) {
    event.preventDefault();

    if (!authInstance) {
      authInstance = await Auth.getInstance();
    }

    profileState.loading = true;

    const { configuration, ...stateWithoutConfig } = profileState;

    if (!validateRequiredFieldsUnchanged(stateWithoutConfig.data)) {
      profileState.loading = false;
      return;
    }

    const updatedProfileData = buildPayload(stateWithoutConfig.data);

    const resp = await getUnidyClient().profile.updateProfile({
      idToken: (await authInstance?.getToken()) as string,
      data: updatedProfileData,
      lang: unidyState.locale,
    });

    if (resp?.success) {
      profileState.loading = false;
      profileState.configuration = JSON.parse(JSON.stringify(resp.data));
      profileState.configUpdateSource = "submit";
      profileState.errors = {};
    } else {
      if (resp?.data && "flatErrors" in resp.data) {
        profileState.errors = resp.data.flatErrors as Record<string, string>;
      } else {
        profileState.flashErrors = { [String(resp?.status)]: String(resp?.error) };
      }
      profileState.loading = false;
    }
  },

  isDisabled(_forProp, disabled?: boolean): boolean {
    return (
      disabled ||
      (profileState.errors && Object.keys(profileState.errors).length > 0) ||
      profileState.phoneValid === false
    );
  },

  isLoading(): boolean {
    return profileState.loading;
  },
};
