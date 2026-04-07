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
  /** Comma-separated list of field names to display. If not provided, all fields are shown. */
  @Prop() fields?: string;

  /** How to display country codes in select fields: "icon" for flag emoji, "label" for text. */
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";

  /** Enable or disable autosave. When enabled, profile saves on blur by default, or after a delay if saveDelay is set. */
  @Prop() enableAutosave = false;

  /** Optional delay in milliseconds before autosave triggers after the last change. If not set, saves on blur instead. */
  @Prop() saveDelay?: number;

  private profileRef?: HTMLUProfileElement;

  /** Programmatically submit the profile form. Delegates to the inner u-profile component. */
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
        enableAutosave={this.enableAutosave}
        saveDelay={this.saveDelay}
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
