import { Component, Element, h } from "@stencil/core";
import { getUnidyClient } from "../../../shared/api-client";
import { state as profileState } from "../../../profile/store/profile-store";
import { authState, authStore } from "../../store/auth-store";
import { validateRequiredFieldsUnchanged, buildPayload } from "../../../shared/components/u-fields-submit-button-logic/submit-button-logic";
import type { TokenResponse } from "../../api/auth";
import { hasSlotContent } from "../../../shared/component-utils";
import { t } from "../../../i18n";

@Component({
  tag: "u-missing-fields-submit-button",
  shadow: true,
})
export class MissingFieldsSubmitButton {
  @Element() el!: HTMLElement;

  private async onSubmit() {
    profileState.loading = true;

    const { configuration, ...stateWithoutConfig } = profileState;

    if (!validateRequiredFieldsUnchanged(stateWithoutConfig.data)) {
      profileState.loading = false;
      return;
    }

    const updatedProfileData = buildPayload(stateWithoutConfig.data);
    const sid = authState.sid as string;

    const [error, response] = await getUnidyClient().auth.updateMissingFields(sid, updatedProfileData);

    if (error) {
      profileState.loading = false;
      return;
    }

    const { jwt } = response as TokenResponse;
    profileState.loading = false;
    authStore.setToken(jwt);
  }

  render() {
    if (authState.step !== "missing-fields") return null;
    return (
      <div>
        <button
          type="button"
          onClick={() => this.onSubmit()}
          part="button"
          disabled={(profileState.errors && Object.keys(profileState.errors).length > 0) || profileState.phoneValid === false}
          aria-live="polite"
        >
          {profileState.loading ? <u-spinner /> : hasSlotContent(this.el) ? <slot /> : t("buttons.submit")}
        </button>
      </div>
    );
  }
}
