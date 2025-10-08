import { Component, Prop, State, h, Element } from "@stencil/core";
import { state as profileState } from "../../../store/profile-store";
/**
 * @part select
 * @part option
 * @part radio
 * @part radio-group
 * @part radio-label
 * @part radio-checked
 * @part checkbox
 * @part checkbox-group
 * @part checkbox-label
 * @part textarea
 * @part input
 */

@Component({
  tag: "unidy-field",
  styleUrl: "unidy-field.css",
  shadow: true,
})
export class UnidyField {
  @Prop() field!: string;
  @Prop() required = false;
  @Prop() readonlyPlaceholder = "";
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";
  @Prop() invalidPhoneMessage = "Please enter a valid phone number.";
  @Prop() customStyle?: string;
  @Prop() emptyOption = true;
  @Prop() placeholder?: string;

  @Element() el!: HTMLElement;

  @State() selected?: string | string[];

  private getFieldData() {
    return this.field.startsWith("custom_attributes.")
      ? profileState.data.custom_attributes?.[this.field.replace("custom_attributes.", "")]
      : profileState.data[this.field];
  }

  componentWillLoad() {}

  componentDidRender() {
    const fieldErrors = profileState.errors;
    if (fieldErrors?.[this.field]) {
      this.el.shadowRoot?.getElementById(this.field)?.focus();
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: needed for dynamic fieldData
  private multiSelectLabel = (fieldData: any): string[] => {
    const multiselectMatches: string[] = [];
    Array.isArray(fieldData.value)
      ? fieldData.value.map((val: string) => {
          // biome-ignore lint/suspicious/noExplicitAny: needed for dynamic option
          const match = fieldData.options?.find((opt: any) => opt.value === val);
          multiselectMatches.push(match?.label ?? val);
        })
      : [];
    return multiselectMatches;
  };

  render() {
    if (profileState.loading) {
      return <div class="spinner" />;
    }

    const fieldData = this.getFieldData();
    if (!fieldData) {
      return null;
    }
    const isLocked = !!fieldData?.locked;
    const lockedText = fieldData?.locked_text ? fieldData.locked_text : "";
    const isReadonly = fieldData?.readonly === true;
    const multiSelectReadonlyLabels = this.multiSelectLabel(fieldData);
    // TODO: Add other types
    return (
      <div>
        <label htmlFor={this.field} part="label">
          {fieldData?.label}
          {fieldData?.required || this.required ? <span part="required-indicator"> *</span> : null}
        </label>
        {isReadonly && fieldData?.type !== "checkbox" ? (
          <span part="readonly-indicator">{fieldData?.value || this.readonlyPlaceholder}</span>
        ) : null}
        {isReadonly && fieldData?.type === "checkbox" && (
          <div part="multi-select-readonly-container">
            {multiSelectReadonlyLabels.map((label) => (
              <span key={label} part="multi-select-readonly-field">
                {label}
              </span>
            ))}
          </div>
        )}
        {!isReadonly && (
            <unidy-raw-field
              id={this.field}
              name={this.field}
              type={fieldData.type as string}
              value={fieldData.value}
              options={fieldData.type === "select" ? fieldData.options : undefined}
              radioOptions={fieldData.type === "radio" ? fieldData.radio_options : undefined}
              multiSelectOptions={fieldData.type === "checkbox" ? fieldData.options : undefined}
              required={fieldData.required || this.required}
              disabled={isLocked}
              tooltip={isLocked ? lockedText : undefined}
              placeholder={this.placeholder}
              customStyle={this.customStyle}
              emptyOption={this.emptyOption}
              countryCodeDisplayOption={this.countryCodeDisplayOption}
              attrName={fieldData.attr_name}
            />
          )}

        {profileState.errors[this.field] && <span part="field-error-message">ERROR: {profileState.errors[this.field]}</span>}
      </div>
    );
  }
}
