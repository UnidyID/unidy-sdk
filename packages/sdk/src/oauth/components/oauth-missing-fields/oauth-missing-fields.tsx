import { Component, Element, h, Host, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
import { getOAuthProvider, type OAuthProviderElement } from "../context";
import { oauthState, onChange, setOAuthFieldValue } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-missing-fields",
  shadow: false,
})
export class OAuthMissingFields {
  @Element() el!: HTMLElement;

  /**
   * Custom CSS class name(s) to apply to the container element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() private missingFields: string[] = [];
  @State() private fieldValues: Record<string, unknown> = {};

  private provider: OAuthProviderElement | null = null;
  private unsubscribers: Array<() => void> = [];

  componentWillLoad() {
    this.provider = getOAuthProvider(this.el);

    if (!this.provider) {
      console.warn("[u-oauth-missing-fields] Must be used inside a u-oauth-provider");
      return;
    }

    this.missingFields = oauthState.missingFields;
    this.fieldValues = oauthState.fieldValues;

    this.unsubscribers.push(
      onChange("missingFields", (fields) => {
        this.missingFields = fields;
      })
    );

    this.unsubscribers.push(
      onChange("fieldValues", (values) => {
        this.fieldValues = values;
      })
    );
  }

  disconnectedCallback() {
    this.unsubscribers.forEach((unsub) => unsub());
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
    // Try to get translation, fall back to humanized field name
    const translationKey = `fields.${fieldName}.label`;
    const translated = t(translationKey);

    if (translated !== translationKey) {
      return translated;
    }

    // Humanize the field name
    return fieldName
      .replace("custom_attributes.", "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private renderField(fieldName: string) {
    const label = this.getFieldLabel(fieldName);
    const value = (this.fieldValues[fieldName] as string) ?? "";
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
  }

  render() {
    if (this.missingFields.length === 0) {
      return null;
    }

    return (
      <Host>
        <div class={this.componentClassName}>
          {this.missingFields.map((fieldName) => this.renderField(fieldName))}
        </div>
      </Host>
    );
  }
}
