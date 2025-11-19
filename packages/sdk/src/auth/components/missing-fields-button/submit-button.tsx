import { Component, Element, h } from "@stencil/core";
import { getUnidyClient } from "../../api-client";
import { state as profileState } from "../../../profile/store/profile-store";
import { authState, authStore } from "../../store/auth-store";
import { validateRequiredFieldsUnchanged, buildPayload } from "../../../shared/components/u-fields-submit-button-logic/submit-button-logic";
import { jwtDecode } from "jwt-decode";
import type { TokenResponse } from "../../api/auth";
import type { TokenPayload } from "../../auth";

@Component({
  tag: "u-missing-fields-submit-button",
  shadow: true
})
export class SubmitButton {
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

    let error: string | null;
    let response: unknown;

    if (sid) {
      // Password Sign-In Flow
      [error, response] = await getUnidyClient().auth.updateMissingFields(sid, updatedProfileData);
    } else {
      // Social Sign-In Flow
      [error, response] = await getUnidyClient().auth.updateMissingFieldsSocial(updatedProfileData);
    }

    if (error) {
      return;
    }

    const { jwt } = (response as TokenResponse);
    profileState.loading = false;
    authStore.setToken(jwt);

    // needed for social sign-in flow
    if (!authState.sid) {
      const decodedToken = jwtDecode<TokenPayload>(jwt);
      authStore.setSignInId(decodedToken.sid);
    }
  }

  private hasSlotContent(): boolean {
    return this.el.hasChildNodes() && this.el.textContent?.trim() !== "";
  }

  render() {
   if (authState.step !== "missing-fields") return null;
    return (
      <div>
        <button type="button" onClick={() => this.onSubmit()} part="button" disabled={profileState.errors && Object.keys(profileState.errors).length > 0 || profileState.phoneValid === false}>
          {profileState.loading ? <span class="spinner" /> : this.hasSlotContent() ? <slot /> : "SUBMIT BY DEFAULT"}
        </button>
      </div>
    );
  }
}
