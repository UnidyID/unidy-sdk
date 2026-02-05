import { Component, Element, h, Prop, State } from "@stencil/core";
import { t } from "../../../i18n";
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
  /** The field name (e.g., 'first_name', 'custom_attributes.favorite_color'). */
  @Prop() field!: string;
  /** If true, marks the field as required (in addition to backend configuration). */
  @Prop() required = false;
  /** Placeholder text shown when field is readonly and has no value. */
  @Prop() readonlyPlaceholder = "No information";
  /** For phone fields: how to display country code selector ('icon' or 'label'). */
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";
  /** Error message shown when phone number validation fails. */
  @Prop() invalidPhoneMessage = "Please enter a valid phone number.";
  /** CSS classes to apply to the input element. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;
  /** If true, includes an empty option in select dropdowns. */
  @Prop() emptyOption = true;
  /** Placeholder text for the input field. */
  @Prop() placeholder?: string;
  /** If true, renders the default label above the field. */
  @Prop() renderDefaultLabel = true;

  /** Regex pattern for custom validation. */
  @Prop() pattern?: string;
  /** Error message shown when pattern validation fails. */
  @Prop() patternErrorMessage?: string;
  /** Custom validation function. Returns { valid: boolean, message?: string }. */
  @Prop() validationFunc?: (value: string | string[]) => { valid: boolean; message?: string };

  @Element() el!: HTMLElement;

  @State() selected?: string | string[];

  private getFieldData() {
    return this.field.startsWith("custom_attributes.")
      ? profileState.data.custom_attributes?.[this.field.replace("custom_attributes.", "")]
      : profileState.data[this.field];
  }

  componentDidRender() {
    const fieldErrors = profileState.errors;

    if (Object.keys(fieldErrors)[0] === this.field) {
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
    if (Array.isArray(fieldData.value)) {
      for (const val of fieldData.value) {
        // biome-ignore lint/suspicious/noExplicitAny: needed for dynamic option
        const match = fieldData.options?.find((opt: any) => opt.value === val);
        const optionTranslationKey = `fields.${this.field}.options.${val}`;
        const translatedOptionLabel = t(optionTranslationKey);
        const optionLabel = translatedOptionLabel !== optionTranslationKey ? translatedOptionLabel : match?.label;
        multiselectMatches.push(optionLabel ?? val);
      }
    }
    return multiselectMatches;
  };

  render() {
    const fieldData = this.getFieldData();
    if (!fieldData) {
      return null;
    }

    const labelTranslationKey = `fields.${this.field}.label`;
    const label = t(labelTranslationKey, { defaultValue: fieldData?.label });

    const placeholderTranslationKey = `fields.${this.field}.placeholder`;
    const placeholder = t(placeholderTranslationKey, { defaultValue: this.placeholder ? this.placeholder : "" });

    const readonlyPlaceholderTranslationKey = `fields.${this.field}.readonlyPlaceholder`;
    const readonlyPlaceholder = t(readonlyPlaceholderTranslationKey, {
      defaultValue: this.readonlyPlaceholder ? this.readonlyPlaceholder : "",
    });

    const translatedOptions = (fieldData.options || []).map((opt) => {
      const translationKey = `fields.${this.field}.options.${opt.value}`;
      const label = t(translationKey, { defaultValue: opt.label });
      return { ...opt, label };
    });

    const translatedRadioOptions = (fieldData.radio_options || []).map((opt) => {
      const translationKey = `fields.${this.field}.options.${opt.value}`;
      const label = t(translationKey, { defaultValue: opt.label });
      return { ...opt, label };
    });

    const errorPrefix = t("errors.prefix", { defaultValue: "ERROR: " });

    const isLocked = !!fieldData?.locked;
    const lockedText = fieldData?.locked_text ? fieldData.locked_text : "";
    const isReadonly = fieldData?.readonly === true;
    const multiSelectReadonlyLabels = this.multiSelectLabel(fieldData);

    return (
      <div part={`field-container field-container--${this.createSpecificPartKey(this.field)}`}>
        <slot name="label" />

        {this.renderDefaultLabel && (
          <label htmlFor={this.field} part={`field_label field_label--${this.createSpecificPartKey(this.field)}`}>
            {label}
            {fieldData?.required || this.required ? <span part="required-indicator"> *</span> : null}
          </label>
        )}
        {isReadonly && fieldData?.type !== "checkbox" ? (
          <span id={this.field} part="readonly-indicator">
            {fieldData?.value || readonlyPlaceholder}
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
            options={fieldData.type === "select" ? translatedOptions : undefined}
            radioOptions={fieldData.type === "radio" ? translatedRadioOptions : undefined}
            multiSelectOptions={fieldData.type === "checkbox" ? translatedOptions : undefined}
            required={fieldData.required || this.required}
            // disable editing of email field
            disabled={isLocked || profileState.loading || this.field === "email"}
            tooltip={isLocked ? lockedText : undefined}
            placeholder={placeholder}
            componentClassName={this.componentClassName}
            emptyOption={this.emptyOption}
            countryCodeDisplayOption={this.countryCodeDisplayOption}
            attrName={fieldData.attr_name}
            specificPartKey={this.createSpecificPartKey(this.field)}
            ariaDescribedBy={profileState.errors[this.field] ? `${this.field}-error` : undefined}
            pattern={this.pattern}
            patternErrorMessage={this.patternErrorMessage}
            validationFunc={this.validationFunc}
          />
        )}

        {profileState.errors[this.field] && (
          <span id={`${this.field}-error`} part="field-error-message" aria-live="assertive">
            {errorPrefix} {profileState.errors[this.field]}
          </span>
        )}
      </div>
    );
  }
}
