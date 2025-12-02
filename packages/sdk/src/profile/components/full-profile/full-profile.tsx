import { Component, h, Prop } from "@stencil/core";
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

  @Prop() submitButtonText = "Submit";

  private list() {
    if (this.fields) {
      return this.fields
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean);
    }
    return [
      ...Object.keys(profileState.data || {}).filter((field) => field !== "custom_attributes" && field !== "email"),
      ...Object.keys(profileState.data?.custom_attributes || {}).map((field) => `custom_attributes.${field}`),
    ];
  }

  render() {
    return (
      <u-profile language={this.language}>
        {this.list().map((field) => (
          <u-field key={field} field={field} countryCodeDisplayOption={this.countryCodeDisplayOption} />
        ))}
        <div class="flex justify-end">
          <u-profile-submit-button>{this.submitButtonText}</u-profile-submit-button>
        </div>
      </u-profile>
    );
  }
}
