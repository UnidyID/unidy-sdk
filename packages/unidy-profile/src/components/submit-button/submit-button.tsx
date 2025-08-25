import { Component, Element, h } from "@stencil/core";

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
    const updatedProfileData = this.buildUpdatedConfigurationPayload(configuration, stateWithoutConfig.data);

    const resp = await this.store.state.client?.profile.updateProfile(idToken, updatedProfileData);

    if (resp?.success) {
      this.store.state.loading = false;
      this.store.state.configuration = JSON.parse(JSON.stringify(resp.data));
    } else {
      this.store.state.errors = { "status": String(resp?.status) };
    }
  };

  private buildUpdatedConfigurationPayload(
    configuration: Record<string, any> | undefined,
    stateData: Record<string, any> | undefined
  ): Record<string, any> | undefined {
    if (!configuration) return undefined;

    const updated =
      typeof structuredClone === "function"
        ? structuredClone(configuration)
        : JSON.parse(JSON.stringify(configuration));

    const hasValueProp = (obj: any): obj is { value: any } =>
      obj && typeof obj === "object" && "value" in obj;

    const tryUpdate = (container: Record<string, any>, key: string, value: any) => {
      if (container && hasValueProp(container[key])) {

        container[key] = { ...container[key], value };
        return true;
      }
      return false;
    };

    if (stateData) {
      for (const key of Object.keys(stateData)) {
        const newVal = stateData[key]?.value;

        if (tryUpdate(updated, key, newVal)) continue;

        if (updated.custom_attributes && tryUpdate(updated.custom_attributes, key, newVal)) continue;

      }
    }

    const toValue = (field: any) => (hasValueProp(field) ? field.value : field);

    const flattenedConfig: Record<string, any> = {};
    for (const key of Object.keys(updated)) {
      if (key === "custom_attributes") {
        const customAttrs = updated.custom_attributes || {};
        const flattenedAttrs: Record<string, any> = {};
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
        <button onClick={() => this.onSubmit()} type="button" part="unidy-button">
          {this.store.state.loading
            ? <span class="spinner"></span>
            : (this.hasSlotContent() ? <slot /> : "SUBMIT BY DEFAULT")}
        </button>
      </div>
    );
  }
}
