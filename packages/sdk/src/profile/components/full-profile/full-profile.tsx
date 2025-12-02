import { Component, h, Host, Prop } from "@stencil/core";
import type { ProfileRaw } from "../../store/profile-store";
import { state as profileState } from "../../store/profile-store";

@Component({
  tag: "u-full-profile",
  styleUrl: "full-profile.css",
  shadow: false,
})
export class FullProfile {
  @Prop() language?: string;

  @Prop() fields?: string;
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";
  @Prop() renderDefaultLabel = true;

  @Prop() submitButtonText = "Submit";

  private list() {
    if (this.fields) {
      return this.fields
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean);
    }
    return [
      ...Object.keys((profileState.data as ProfileRaw) || {}).filter((field) => field !== "custom_attributes" && field !== "email"),
      ...Object.keys(profileState.data?.custom_attributes || {}).map((field) => `custom_attributes.${field}`),
    ];
  }

  render() {
    return (
      <Host>
        <slot name="before-fields" />
        <u-profile language={this.language}>
          {this.list().map((field) => (
            <u-field
              key={field}
              field={field}
              renderDefaultLabel={this.renderDefaultLabel}
              countryCodeDisplayOption={this.countryCodeDisplayOption}
            />
          ))}

          <div class="flex justify-end">
            <u-profile-submit-button>{this.submitButtonText}</u-profile-submit-button>
          </div>

          <div id="profile-update-message" />
        </u-profile>
        <slot name="after-fields" />
      </Host>
    );
  }
}
