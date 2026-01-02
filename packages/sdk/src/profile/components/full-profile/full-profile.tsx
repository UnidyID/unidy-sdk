import { Component, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { state as profileState } from "../../store/profile-store";

@Component({
  tag: "u-full-profile",
  styleUrl: "full-profile.css",
  shadow: false,
})
export class FullProfile {
  @Prop() fields?: string;
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";

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
      <u-profile>
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
