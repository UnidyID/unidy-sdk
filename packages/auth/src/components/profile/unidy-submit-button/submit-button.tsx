import { Component, Element, h } from "@stencil/core";
import { getUnidyClient } from "../../../api-client";
import { Auth } from "../../../auth";
import { type ProfileRaw, state as profileState } from "../../../store/profile-store";
@Component({
  tag: "u-profile-submit-button",
  shadow: true,
  styleUrl: "submit-button.css",
})
export class SubmitButton {
  @Element() el!: HTMLElement;

  private authInstance?: Auth;

  async componentWillLoad() {
    this.authInstance = await Auth.getInstance();
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

    const resp = await getUnidyClient().profile.updateProfile({
      idToken: (await this.authInstance?.getToken()) as string,
      data: updatedProfileData,
      lang: profileState.language,
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
    return (
      <div>
        <button
          type="button"
          onClick={() => this.onSubmit()}
          part="button"
          disabled={(profileState.errors && Object.keys(profileState.errors).length > 0) || profileState.phoneValid === false}
        >
          {profileState.loading ? <span class="spinner" /> : this.hasSlotContent() ? <slot /> : "SUBMIT BY DEFAULT"}
        </button>
      </div>
    );
  }
}
