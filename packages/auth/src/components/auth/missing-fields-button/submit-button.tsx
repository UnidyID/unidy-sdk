import { Component, Element, h } from "@stencil/core";
import { getUnidyClient } from "../../../api-client";
import { type ProfileRaw, state as profileState } from "../../../store/profile-store";
import { authState, authStore } from "../../../store/auth-store";
@Component({
  tag: "u-missing-fields-submit-button",
  shadow: true
})
export class SubmitButton {
  @Element() el!: HTMLElement;

  async componentWillLoad() {
  }

  private async onSubmit() {
    profileState.loading = true;

    const { configuration, ...stateWithoutConfig } = profileState;

    for (const key of Object.keys(stateWithoutConfig.data)) {
      if (key === "custom_attributes") continue;
      const field = stateWithoutConfig.data[key];
      if (field.required === true && (field.value === "" || field.value === null || field.value === undefined)) {
        profileState.errors = { [key]: "This field is required." };
        profileState.loading = false;
        return;
      }
    }

    for (const key of Object.keys(stateWithoutConfig.data.custom_attributes ?? {})) {
      const field = stateWithoutConfig.data.custom_attributes?.[key];
      const fieldDisplayName = `custom_attributes.${key}`;
      if (field?.required === true && (field.value === "" || field.value === null || field.value === undefined)) {
        profileState.errors = { [fieldDisplayName]: "This field is required." };
        profileState.loading = false;
        return;
      }
    }

    const updatedProfileData = this.buildPayload(stateWithoutConfig.data);
    const sid = authState.sid as string;

    const [error, response] = await getUnidyClient().auth.updateMissingFields(sid, updatedProfileData);

    if (error) {
      return;
    }

    const { jwt } = response;
    profileState.loading = false;
    authStore.setToken(jwt);
  }

  private buildPayload(stateData: ProfileRaw) {
    return {
      ...Object.fromEntries(
        Object.entries(stateData)
          .filter(([k]) => k !== "custom_attributes")
          .map(([k, v]: [string, unknown]) => [k, (v as { value: unknown }).value]),
      ),
      custom_attributes: Object.fromEntries(
        Object.entries(stateData.custom_attributes ?? {}).map(([k, v]: [string, unknown]) => [k, (v as { value: unknown }).value]),
      ),
    };
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
