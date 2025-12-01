import { Component, Prop, State, h, Element } from "@stencil/core";
import { state as profileState } from "../../store/profile-store";
/**
 * @part select_field - Styles the base <select> element.
 * @part select_field--example_field - Example of a field-specific selector.
 *   Replace `example_field` with your field name.
 *   e.g. `custom_attributes.favorite_nut` → `select_field--custom_attributes-favorite_nut`, `country_code` → `select_field--country-code`
 * @part radio-group-item_radio
 * @part radio-group_field
 * @part radio-group-item_label
 * @part radio_checked
 * @part multi-select-item_checkbox
 * @part multi-select-group_field
 * @part multi-select-item_label
 * @part textarea_field
 * @part input_field
 */

@Component({
  tag: "u-field",
  styleUrl: "field.css",
  shadow: true,
})
export class Field {
  @Prop() field!: string;
  @Prop() required = false;
  @Prop() readonlyPlaceholder = "No information";
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";
  @Prop() invalidPhoneMessage = "Please enter a valid phone number.";
  @Prop({ attribute: "class-name" }) componentClassName?: string;
  @Prop() emptyOption = true;
  @Prop() placeholder?: string;
  @Prop() renderDefaultLabel = true;

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
      this.el.shadowRoot?.getElementById(this.field)?.scrollIntoView({ behavior: "smooth", block: "center" });
      this.el.shadowRoot
        ?.getElementById(this.field)
        ?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, select, textarea")
        ?.focus();
    }
  }

  private createSpecificPartKey(fieldName: string) {
    if (fieldName.startsWith("custom_attributes.")) {
      return fieldName.replace(/[^\w-]/g, "-");
    }
    return fieldName;
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
      return <u-spinner />;
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
      <div part={`field-container field-container--${this.createSpecificPartKey(this.field)}`}>
        <slot name="label" />

        {this.renderDefaultLabel && (
          <label htmlFor={this.field} part={`field_label field_label--${this.createSpecificPartKey(this.field)}`}>
            {fieldData?.label}
            {fieldData?.required || this.required ? <span part="required-indicator"> *</span> : null}
          </label>
        )}
        {isReadonly && fieldData?.type !== "checkbox" ? (
          <span id={this.field} part="readonly-indicator">
            {fieldData?.value || this.readonlyPlaceholder}
          </span>
        ) : null}
        {isReadonly && fieldData?.type === "checkbox" && (
          <ul id={this.field} class="multi-select-readonly-container" part="multi-select-readonly-container">
            {multiSelectReadonlyLabels.map((label) => (
              <li key={label} part="multi-select-readonly-field">
                {label}
              </li>
            ))}
          </ul>
        )}
        {!isReadonly && (
          <u-raw-field
            id={this.field}
            field={this.field}
            type={fieldData.type as string}
            value={fieldData.value}
            options={fieldData.type === "select" ? fieldData.options : undefined}
            radioOptions={fieldData.type === "radio" ? fieldData.radio_options : undefined}
            multiSelectOptions={fieldData.type === "checkbox" ? fieldData.options : undefined}
            required={fieldData.required || this.required}
            disabled={isLocked}
            tooltip={isLocked ? lockedText : undefined}
            placeholder={this.placeholder}
            componentClassName={this.componentClassName}
            emptyOption={this.emptyOption}
            countryCodeDisplayOption={this.countryCodeDisplayOption}
            attrName={fieldData.attr_name}
            specificPartKey={this.createSpecificPartKey(this.field)}
            ariaDescribedBy={profileState.errors[this.field] ? `${this.field}-error` : undefined}
          />
        )}

        {profileState.errors[this.field] && (
          <span id={`${this.field}-error`} part="field-error-message" aria-live="assertive">
            ERROR: {profileState.errors[this.field]}
          </span>
        )}
      </div>
    );
  }
}
