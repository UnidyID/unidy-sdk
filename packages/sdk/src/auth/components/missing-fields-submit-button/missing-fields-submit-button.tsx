import { Component, h, Prop } from "@stencil/core";
import { getUnidyClient } from "../../../api";
import { t } from "../../../i18n";
import { buildPayload, validateRequiredFieldsUnchanged } from "../../../profile/profile-helpers";
import { state as profileState } from "../../../profile/store/profile-store";
import { UnidyComponent } from "../../../shared/base/component";
import { HasSlotFactory } from "../../../shared/base/has-slot-content";
import type { TokenResponse } from "../../api/auth";
import { authState, authStore } from "../../store/auth-store";

@Component({
  tag: "u-missing-fields-submit-button",
  shadow: false,
})
export class MissingFieldsSubmitButton extends UnidyComponent(HasSlotFactory) {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  private async onSubmit() {
    profileState.loading = true;

    const { configuration, ...stateWithoutConfig } = profileState;

    if (!validateRequiredFieldsUnchanged(stateWithoutConfig.data)) {
      profileState.loading = false;
      return;
    }

    const updatedProfileData = buildPayload(stateWithoutConfig.data);
    const sid = authState.sid as string;

    const [error, response] = await getUnidyClient().auth.updateMissingFields({
      signInId: sid,
      payload: { user: updatedProfileData },
    });

    if (error) {
      profileState.loading = false;
      return;
    }

    const { jwt } = response as TokenResponse;
    profileState.loading = false;
    authStore.setToken(jwt);

    // Emit authEvent to allow modal-based logins to close after successful submission
    this.element.dispatchEvent(new CustomEvent("authEvent", { detail: { jwt }, bubbles: true, composed: true }));
  }

  render() {
    if (authState.step !== "missing-fields") return null;

    return (
      <div>
        <button
          type="button"
          onClick={() => this.onSubmit()}
          part="button"
          class={this.componentClassName}
          disabled={(profileState.errors && Object.keys(profileState.errors).length > 0) || profileState.phoneValid === false}
          aria-live="polite"
        >
          {profileState.loading ? <u-spinner /> : this.hasSlot ? <slot /> : t("buttons.submit")}
        </button>
      </div>
    );
  }
}
