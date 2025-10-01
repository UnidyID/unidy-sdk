import { Component, Element, Prop, State, h } from "@stencil/core";
import { Input } from "../../raw-components/input-field/Input";
import { Textarea } from "../../raw-components/input-field/Textarea";
import { RadioGroup } from "../../raw-components/input-field/RadioGroup";
import { MultiSelect } from "../../raw-components/input-field/MultiSelect";
import { Select } from "../../raw-components/input-field/Select";

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
  @Prop() className?: string;

  @Element() el!: HTMLElement;

  @State() selected?: string | string[];

  private get store() {
    const container = this.el.closest("unidy-profile");
    if (!container) {
      throw new Error("unidy-field must be inside an unidy-profile");
    }
    return container.store;
  }

  private getFieldData() {
    return this.field.startsWith("custom_attributes.") ? this.store.state.data.custom_attributes?.[this.field.replace("custom_attributes.", "")] : this.store.state.data[this.field];
  }

  componentWillLoad() {
    const fieldData = this.getFieldData();
    if (fieldData?.radio_options?.length) {
      const checkedOption = fieldData.radio_options.find(option => option.checked);
      this.selected = checkedOption?.value ?? fieldData.value ?? "";
    } else if (fieldData?.options?.length) {
      const selectedOption = fieldData.options.find(option => option.value === fieldData.value);
      this.selected = selectedOption?.value ?? fieldData.value ?? "";
    } else {
      this.selected = fieldData?.value ?? "";
    }
  }

  componentDidRender() {
    const fieldErrors = this.store.state.errors;
    if (fieldErrors?.[this.field]) {
      this.el.shadowRoot?.getElementById(this.field)?.focus();
    }
  }

  private updateField(updatedField: object) {
    if (this.field.startsWith("custom_attributes.") && this.store.state.data.custom_attributes) {
      this.store.state.data.custom_attributes[this.field.replace("custom_attributes.", "")] = updatedField;
    } else {
      this.store.state.data[this.field] = updatedField;
    }
  }

  private onTextValueChange = (value: string) => {
    const isCustomAttribute = this.field.startsWith("custom_attributes.");
    const key = this.field.replace("custom_attributes.", "");

    this.store.state.data = isCustomAttribute
      ? {
          ...this.store.state.data,
          custom_attributes: {
            ...this.store.state.data.custom_attributes,
            [key]: {
              ...this.store.state.data.custom_attributes?.[key],
              value,
            },
          },
        }
      : {
          ...this.store.state.data,
          [this.field]: {
            ...this.store.state.data[this.field],
            value,
          },
        };
  };

  private onRadioChange = (value: string) => {
    this.selected = value;

    const fieldData = this.getFieldData();
    if (!fieldData?.radio_options) return;

    const updatedRadioOptions = fieldData.radio_options.map(option => ({
      ...option,
      checked: option.value === value,
    }));

    const updatedField = {
      ...fieldData,
      value: String(value),
      radio_options: updatedRadioOptions,
    };

    this.updateField(updatedField);
  };

  private onSelectChange = (value: string) => {
    this.selected = value;

    const fieldData = this.getFieldData();
    if (!fieldData?.options) return;

    const updatedOptions = fieldData.options.map(option => ({
      ...option,
      selected: option.value === value,
    }));

    const updatedField = {
      ...fieldData,
      value,
      options: updatedOptions,
    };

    this.updateField(updatedField);
  }

  private phoneFieldValidation = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const pattern = /^(?=.{4,13}$)(\+\d+|\d+)$/;
    if (input.value !== '' && !pattern.test(input.value)) {
      input.setCustomValidity(this.invalidPhoneMessage);
      input.reportValidity();
      this.store.state.phoneValid = false;
    } else {
      input.setCustomValidity("");
      this.store.state.phoneValid = true;
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

  private onMultiSelectToggle = (optValue: string, checked: boolean) => {
    const isCustomAttribute = this.field.startsWith("custom_attributes.");
    const key = this.field.replace("custom_attributes.", "");

    const prev: string[] = isCustomAttribute
      ? (this.store.state.data.custom_attributes?.[key]?.value as string[]) ?? []
      : (this.store.state.data[this.field]?.value as string[]) ?? [];

    const updatedValues = checked
      ? (prev.includes(optValue) ? prev : [...prev, optValue])
      : prev.filter(v => v !== optValue);

    const baseField = isCustomAttribute
      ? this.store.state.data.custom_attributes?.[key]
      : this.store.state.data[this.field];

    const updatedField = { ...baseField, value: updatedValues };
    this.updateField(updatedField);
  };

  private countryIcon(countryCode: string, placeholder = "➖"): string {
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return placeholder;
    }

    return Array.from(countryCode)
      .map(char =>
        String.fromCodePoint(0x1f1e6 + (char.charCodeAt(0) - "A".charCodeAt(0)))
      )
      .join("");
  }

  render() {
    if (this.store.state.loading) {
      return <div class="spinner"/>;
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
          {fieldData?.required || this.required ? (
            <span part="required-indicator"> *</span>
          ) : null}
        </label>
        {isReadonly && fieldData?.type !== "checkbox" ? (
          <span part="readonly-indicator">
            {fieldData?.value || this.readonlyPlaceholder}
          </span>
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
        {!isReadonly &&
          (fieldData.type === "select" && fieldData.options ? (
            <Select
              id={this.field}
              value={fieldData.value}
              options={fieldData.options}
              disabled={isLocked}
              title={isLocked ? lockedText : undefined}
              onChange={this.onSelectChange}
              countryCodeDisplayOption={this.countryCodeDisplayOption}
              attr_name={fieldData.attr_name}
              countryIcon={this.countryIcon}
            />
          ) : fieldData.radio_options ? (
            <RadioGroup
              options={fieldData.radio_options}
              disabled={isLocked}
              type={fieldData.type}
              name={this.field}
              title={isLocked ? lockedText : undefined}
              onChange={this.onRadioChange}
            />
          ) : fieldData.type === "checkbox" && fieldData.options ? (
            <MultiSelect
              value={Array.isArray(fieldData.value) ? fieldData.value : []}
              options={fieldData.options}
              disabled={isLocked}
              title={isLocked ? lockedText : undefined}
              type={fieldData.type}
              onToggle={this.onMultiSelectToggle}
            />
          ) : fieldData.type === "textarea" ? (
            <Textarea
              id={this.field}
              value={(fieldData.value as string) || ""}
              required={fieldData?.required || this.required}
              disabled={isLocked}
              title={isLocked ? lockedText : undefined}
              onChange={this.onTextValueChange}
            />
          ) : (
            <Input
              id={this.field}
              type={fieldData.type as string}
              value={fieldData.value as string | undefined}
              class={this.store.state.errors[this.field] ? 'field-error' : ''}
              required={fieldData?.required || this.required}
              disabled={isLocked}
              title={isLocked ? lockedText : undefined}
              onChange={this.onTextValueChange}
              onInput={(e) => {
                if (fieldData.type === 'tel') {
                  this.phoneFieldValidation(e);
                }
              }}
            />
          ))}
        {this.store.state.errors[this.field] && (
          <span part="field-error-message">
            ERROR: {this.store.state.errors[this.field]}
          </span>
        )}
      </div>
    );
  }
}
