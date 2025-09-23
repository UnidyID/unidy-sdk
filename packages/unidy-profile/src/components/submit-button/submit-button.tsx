import { Component, Element, h } from "@stencil/core";
import type { ProfileRaw } from "../unidy-profile/unidy-profile";

@Component({
  tag: "submit-button",
  styleUrl: "submit-button.css",
  shadow: true,
})

export class SubmitButton {
  @Element() el!: HTMLElement;

  private get store() {
    const container = this.el.closest("unidy-profile");
    if (!container) {
      throw new Error("submit-button must be inside an unidy-profile");
    }

    return container.store;
  }

  private async onSubmit () {
    this.store.state.loading = true;
    const { configuration, ...stateWithoutConfig } = this.store.state;

    const idToken = this.store.state.idToken;

    for (const key of Object.keys(stateWithoutConfig.data)) {
      if (key === "custom_attributes") continue;
      const field = stateWithoutConfig.data[key];
      if (field.required === true && (field.value === "" || field.value === null || field.value === undefined)) {
        this.store.state.errors = { [key]: "This field is required." };
        this.store.state.loading = false;
        return;
      }
    }

    for (const key of Object.keys(stateWithoutConfig.data.custom_attributes ?? {})) {
      const field = stateWithoutConfig.data.custom_attributes?.[key];
      const fieldDisplayName = `custom_attribute.${key}`;
      if (field?.required === true && (field.value === "" || field.value === null || field.value === undefined)) {
        this.store.state.errors = { [fieldDisplayName]: "This field is required." };
        this.store.state.loading = false;
        return;
      }
    }

    const updatedProfileData = this.buildPayload(stateWithoutConfig.data);

    const resp = await this.store.state.client?.profile.updateProfile({ idToken, data: updatedProfileData, lang: this.store.state.language });

    if (resp?.success) {
      this.store.state.loading = false;
      this.store.state.configuration = JSON.parse(JSON.stringify(resp.data));
      this.store.state.configUpdateSource = "submit";
      this.store.state.errors = {};
    } else {
        if (resp?.data && "flatErrors" in resp.data) {
          this.store.state.errors = resp.data.flatErrors as Record<string, string>;
        } else {
          this.store.state.flashErrors = { [String(resp?.status)]: String(resp?.error) };
        }
        this.store.state.loading = false;
      }
  };

  private buildPayload(stateData: ProfileRaw) {
    return {
      ...Object.fromEntries(
        Object.entries(stateData)
          .filter(([k]) => k !== "custom_attributes")
          .map(([k, v]: [string, unknown]) => [k, (v as { value: unknown }).value])
      ),
      custom_attributes: Object.fromEntries(
        Object.entries(stateData.custom_attributes ?? {}).map(([k, v]: [string, unknown]) => [k, (v as { value: unknown }).value])
      )
    };
  }

  private hasSlotContent(): boolean {
    return this.el.hasChildNodes() && this.el.textContent?.trim() !== "";
  }

  render() {
    return (
      <div>
        <button type="button" onClick={() => this.onSubmit()} part="unidy-button">
          {this.store.state.loading
            ? <span class="spinner"/>
            : (this.hasSlotContent() ? <slot /> : "SUBMIT BY DEFAULT")}
        </button>
      </div>
    );
  }
}
