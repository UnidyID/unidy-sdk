import { Component, Element, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { UnidyComponent } from "../../../logger";
import { oauthState, setOAuthFieldValue } from "../../store/oauth-store";
import { getOAuthProvider, type OAuthProviderElement } from "../context";

@Component({
  tag: "u-oauth-missing-fields",
  shadow: false,
})
export class OAuthMissingFields extends UnidyComponent() {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName = "";

  private provider: OAuthProviderElement | null = null;

  componentWillLoad() {
    this.provider = getOAuthProvider(this.el);

    if (!this.provider) {
      this.logger.warn("Must be used inside a u-oauth-provider");
    }
  }

  private handleFieldChange = (fieldName: string, event: Event) => {
    const target = event.target as HTMLInputElement;
    setOAuthFieldValue(fieldName, target.value);
  };

  private handleKeyDown = async (event: KeyboardEvent) => {
    if (event.key === "Enter" && this.provider) {
      event.preventDefault();
      await this.provider.submit();
    }
  };

  private getFieldLabel(fieldName: string): string {
    const translationKey = `fields.${fieldName}.label`;
    const translated = t(translationKey);

    if (translated !== translationKey) {
      return translated;
    }

    return fieldName
      .replace("custom_attributes.", "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  render() {
    if (oauthState.missingFields.length === 0) {
      return null;
    }

    return (
      <div class={this.componentClassName}>
        {oauthState.missingFields.map((fieldName) => {
          const label = this.getFieldLabel(fieldName);
          const value = (oauthState.fieldValues[fieldName] as string) ?? "";
          const inputId = `oauth-field-${fieldName.replace(/\./g, "-")}`;

          return (
            <div class="u-oauth-field" key={fieldName}>
              <label htmlFor={inputId}>
                {label} <span class="u-oauth-field-required">*</span>
              </label>
              <input
                type="text"
                id={inputId}
                name={fieldName}
                value={value}
                required
                onInput={(e) => this.handleFieldChange(fieldName, e)}
                onKeyDown={this.handleKeyDown}
                aria-required="true"
              />
            </div>
          );
        })}
      </div>
    );
  }
}
