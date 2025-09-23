import { Component, Element, h } from "@stencil/core";
import { ProfileRaw } from "../unidy-profile/unidy-profile";

type ProfileFieldValue = string | boolean | number | Date | null | string[];
type ProfileField = { value: ProfileFieldValue; [key: string]: unknown };
type ProfileData = Record<string, { value: ProfileFieldValue } | unknown>;

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
      const field = stateWithoutConfig.data[key] || stateWithoutConfig.data.custom_attributes?.[key];
      if (field.required === true && (field.value === "" || field.value === null || field.value === undefined)) {
        this.store.state.errors = { [key]: "This field is required." };
        this.store.state.loading = false;
        return;
      }
    }
    // TODO: Refactor and fix
    const updatedProfileData = this.buildUpdatedConfigurationPayload(configuration as ProfileRaw, stateWithoutConfig.data);

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

  // TODO: Remove after refactor
  private buildUpdatedConfigurationPayload(
    configuration: ProfileRaw | undefined,
    stateData: ProfileData | undefined
  ): Record<string, ProfileFieldValue | Record<string, ProfileFieldValue>> | undefined {
    if (!configuration) return undefined;

    const updated =
      typeof structuredClone === "function"
        ? structuredClone(configuration)
        : JSON.parse(JSON.stringify(configuration));

    const hasValueProp = (obj: unknown): obj is ProfileField => {
      if (typeof obj !== "object" || obj === null || !("value" in obj)) return false;
      const value = (obj as { value: unknown }).value;
      return (
        typeof value === "string" ||
        typeof value === "boolean" ||
        typeof value === "number" ||
        value instanceof Date ||
        (Array.isArray(value) && value.every(v => typeof v === "string")) ||
        value === null
      );
    };

    const tryUpdate = (container: Record<string, unknown>, key: string, value: ProfileFieldValue) => {
      if (container && hasValueProp(container[key])) {
        container[key] = { ...container[key], value };
        return true;
      }
      return false;
    };

    if (stateData) {
      for (const key of Object.keys(stateData)) {
        const field = stateData[key];
        const newVal = hasValueProp(field) ? field.value : undefined;
        if (newVal === undefined) continue;

        if (tryUpdate(updated, key, newVal)) continue;

        if (updated.custom_attributes && tryUpdate(updated.custom_attributes, key, newVal)) continue;
      }
    }

    const toValue = (field: unknown): ProfileFieldValue => {
      if (hasValueProp(field)) return field.value;
      return field as ProfileFieldValue;
    };

    const flattenedConfig: Record<string, ProfileFieldValue | Record<string, ProfileFieldValue>> = {};
    for (const key of Object.keys(updated)) {
      if (key === "custom_attributes") {
        const customAttrs = updated.custom_attributes || {};
        const flattenedAttrs: Record<string, ProfileFieldValue> = {};
        for (const cKey of Object.keys(customAttrs)) {
          flattenedAttrs[cKey] = toValue(customAttrs[cKey]);
        }
        flattenedConfig.custom_attributes = flattenedAttrs;
      } else {
        flattenedConfig[key] = toValue(updated[key]);
      }
    }

    return flattenedConfig;
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
