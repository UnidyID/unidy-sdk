import { Component, h, Prop } from "@stencil/core";
import { state as profileState } from "../../store/profile-store";
import type { ProfileRaw } from "../../store/profile-store";

@Component({
  tag: "u-full-profile",
  shadow: false,
})
export class FullProfile {
  @Prop() language?: string;

  @Prop() listOfFields?: string;
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";
  @Prop() renderDefaultLabel = true;

  @Prop() profileInformaitionTitle = "Profile Information";
  @Prop() customAttributesTitle = "Custom Attributes";
  @Prop() sectionTitleClassName = "";

  @Prop() logoutButtonText = "Logout";
  @Prop() logoutButtonClassName = "";

  @Prop() submitButtonText = "Submit";

  private parseList(): string[] {
    if (!this.listOfFields) return [];
    return this.listOfFields.split(",");
  }

  private renderBaseFields() {
    const data = profileState.data as ProfileRaw | undefined;
    if (!data) return null;

    const fieldsToRender = this.parseList();
    if (fieldsToRender.length > 0) {
      return fieldsToRender
        .filter((field) => !field.startsWith("custom_attributes.") && field !== "email")
        .map((field) => (
          <u-field key={field} field={field} renderDefaultLabel={true} countryCodeDisplayOption={this.countryCodeDisplayOption} />
        ));
    }

    return Object.keys(data)
      .filter((key) => key !== "custom_attributes" && key !== "email")
      .map((key) => <u-field key={key} field={key} renderDefaultLabel={true} countryCodeDisplayOption={this.countryCodeDisplayOption} />);
  }

  private renderCustomAttributeFields() {
    const data = profileState.data as ProfileRaw | undefined;
    if (!data || !data.custom_attributes) return null;

    const fieldsToRender = this.parseList();
    if (fieldsToRender.length > 0) {
      return fieldsToRender
        .filter((field) => field.startsWith("custom_attributes."))
        .map((field) => (
          <u-field
            key={field}
            field={field}
            renderDefaultLabel={this.renderDefaultLabel}
            countryCodeDisplayOption={this.countryCodeDisplayOption}
          />
        ));
    }

    return Object.keys(data.custom_attributes).map((key) => (
      <u-field
        key={key}
        field={`custom_attributes.${key}`}
        renderDefaultLabel={this.renderDefaultLabel}
        countryCodeDisplayOption={this.countryCodeDisplayOption}
      />
    ));
  }

  render() {
    return (
      <u-profile language={this.language}>
        <div>
          <u-logout-button text={this.logoutButtonText} class-name={this.logoutButtonClassName} />
        </div>
        <div>
          <div class={this.sectionTitleClassName}>{this.profileInformaitionTitle}</div>
          <div>{this.renderBaseFields()}</div>
        </div>
        <div>
          <div class={this.sectionTitleClassName}>{this.customAttributesTitle}</div>
          <div>{this.renderCustomAttributeFields()}</div>
        </div>
        <div class="flex justify-end">
          <u-profile-submit-button>{this.submitButtonText}</u-profile-submit-button>
        </div>

        <div id="profile-update-message" />
      </u-profile>
    );
  }
}
