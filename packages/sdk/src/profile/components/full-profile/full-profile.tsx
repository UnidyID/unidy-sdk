import { Component, h, Method, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { state as profileState } from "../../store/profile-store";

const EXCLUDED_FIELDS = ["custom_attributes", "email", "preferred_language"];

@Component({
  tag: "u-full-profile",
  styleUrl: "full-profile.css",
  shadow: false,
})
export class FullProfile {
  @Prop() fields?: string;
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";

  @Prop() autosave?: "enabled" | "disabled" = "disabled";
  @Prop() autosaveDelay?: number = 1000;

  private profileRef?: HTMLUProfileElement;

  @Method()
  async submitProfile() {
    await this.profileRef?.submitProfile();
  }

  private list() {
    if (this.fields) {
      return this.fields
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean);
    }

    return [
      ...Object.keys(profileState.data || {}).filter((field) => !EXCLUDED_FIELDS.includes(field)),
      ...Object.keys(profileState.data?.custom_attributes || {}).map((field) => `custom_attributes.${field}`),
    ];
  }

  render() {
    return (
      <u-profile
        ref={(el) => {
          this.profileRef = el;
        }}
        autosave={this.autosave}
        autosaveDelay={this.autosaveDelay}
      >
        {this.list().map((field) => (
          <u-field key={field} field={field} countryCodeDisplayOption={this.countryCodeDisplayOption} />
        ))}
        <div class="u:flex u:justify-end">
          <u-submit-button>{t("buttons.submit")}</u-submit-button>
        </div>
      </u-profile>
    );
  }
}
