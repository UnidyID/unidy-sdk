import { Component, h, Prop, State } from "@stencil/core";
import { newsletterStore } from "../../../newsletter/store/newsletter-store";
import { UnidyComponent } from "../../../shared/base/component";
import { type ComponentContext, detectContext } from "../../../shared/context-utils";
import { type ProfileNode, type ProfileRaw, state as profileState } from "../../store/profile-store";
import { Input } from "../raw-input-fields/Input";
import { MultiSelect, type MultiSelectOption } from "../raw-input-fields/MultiSelect";
import { RadioGroup, type RadioOption } from "../raw-input-fields/RadioGroup";
import { type Option, Select } from "../raw-input-fields/Select";
import { Textarea } from "../raw-input-fields/Textarea";

@Component({
  tag: "u-raw-field",
  shadow: false,
})
export class RawField extends UnidyComponent() {
  @Prop() required = false;
  @Prop() readonlyPlaceholder = "";
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";
  @Prop() invalidPhoneMessage = "Please enter a valid phone number.";
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  @Prop() field!: string;
  @Prop() value?: string | string[];
  @Prop() checked?: boolean;
  @Prop() disabled?: boolean;
  @Prop() tooltip?: string;
  @Prop() type!: string;
  @Prop() placeholder?: string;
  @Prop() options?: string | Option[];
  @Prop() emptyOption = false;
  @Prop() attrName?: string;
  @Prop() radioOptions?: RadioOption[];
  @Prop() multiSelectOptions?: MultiSelectOption[];
  @Prop() specificPartKey?: string;
  @Prop() ariaDescribedBy = "";
  @Prop() pattern?: string;
  @Prop() patternErrorMessage?: string;
  @Prop() validationFunc?: (value: string | string[]) => { valid: boolean; message?: string };

  @State() selected?: string | string[];

  private get context(): ComponentContext | null {
    return detectContext(this.element);
  }

  private readStore(fieldName: string): string | undefined | string[] {
    if (!fieldName) return;
    return this.context === "newsletter" ? this.readNewsletterStore(fieldName) : this.readProfileStore(fieldName);
  }

  private readProfileStore(fieldName: string): string | undefined | string[] {
    const data: ProfileRaw = profileState.data;

    if (!data) return;

    let field: ProfileNode | undefined;

    if (fieldName.startsWith("custom_attributes.")) {
      const key = fieldName.replace("custom_attributes.", "");
      field = data.custom_attributes?.[key];
    } else {
      field = data[fieldName];
    }

    if (!field) return;

    if (field.radio_options) {
      const checkedOption = field.radio_options.find((option: RadioOption) => option.checked);

      const checkedValue = checkedOption?.value ?? field.value ?? "";

      return String(checkedValue);
    }

    if (field.type === "checkbox") {
      return Array.isArray(field.value) ? field.value : [];
    }

    return field.value;
  }

  private readNewsletterStore(fieldName: string): string | undefined | string[] {
    const field = newsletterStore.state.additionalFields[fieldName];
    return field?.value;
  }

  private writeStore(fieldName: string, value: string | string[]) {
    if (!fieldName) return;
    this.context === "newsletter" ? this.writeNewsletterStore(fieldName, value) : this.writeProfileStore(fieldName, value);
  }

  private writeProfileStore(fieldName: string, value: string | string[]) {
    const data: ProfileRaw = profileState.data;
    if (!data) return;

    const isCustomAttribute = fieldName.startsWith("custom_attributes.");
    const key = isCustomAttribute ? fieldName.replace("custom_attributes.", "") : fieldName;

    if (isCustomAttribute) {
      const field = data.custom_attributes?.[key];
      profileState.data = {
        ...data,
        custom_attributes: {
          ...data.custom_attributes,
          [key]: { ...field, value },
        },
      };
    } else {
      const field = data[key];
      profileState.data = { ...data, [key]: { ...field, value } };
    }
  }

  private writeNewsletterStore(fieldName: string, value: string | string[]) {
    const data = newsletterStore.state.additionalFields;
    newsletterStore.state.additionalFields = {
      ...data,
      [fieldName]: { ...data[fieldName], value },
    };
  }

  private getErrors(): Record<string, string> {
    return this.context === "newsletter" ? newsletterStore.state.additionalFieldErrors : profileState.errors;
  }

  private setErrors(errors: Record<string, string>) {
    if (this.context === "newsletter") {
      newsletterStore.state.additionalFieldErrors = errors;
    } else {
      profileState.errors = errors;
    }
  }

  private runExternalValidator(value: string | string[]) {
    if (this.validationFunc) {
      try {
        return this.validationFunc(value);
      } catch (e) {
        this.logger.error("External validator (validationFunc) threw an error:", e);
        return null;
      }
    }
  }

  private validateValue(value: string | string[]): { valid: boolean; message: string } {
    // TODO: We should validate this when the component is loading.
    if (this.required) {
      const empty = value === undefined || value === null || value === "";
      if (empty) {
        return { valid: false, message: "This field is required." };
      }
    }

    if (this.pattern && typeof value === "string") {
      const regex = new RegExp(this.pattern);
      if (!regex.test(value)) {
        return { valid: false, message: this.patternErrorMessage || "Invalid format." };
      }
    }

    const externalResult = this.runExternalValidator(value);

    if (externalResult && !externalResult.valid) {
      return { valid: false, message: externalResult.message || "Invalid input." };
    }

    if (this.type === "tel") {
      const phonePattern = /^(?=.{4,13}$)(\+\d+|\d+)$/;
      if (typeof value === "string" && value !== "" && !phonePattern.test(value)) {
        return { valid: false, message: this.invalidPhoneMessage };
      }
    }

    return { valid: true, message: "" };
  }

  private getNormalizedOptions(): Option[] {
    if (Array.isArray(this.options)) return this.options;

    // unidy-raw-field select-options prop can be a JSON string
    if (typeof this.options === "string") return JSON.parse(this.options);

    return [];
  }

  private countryIcon(countryCode: string, placeholder = "➖"): string {
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return placeholder;
    }

    return Array.from(countryCode)
      .map((char) => String.fromCodePoint(0x1f1e6 + (char.charCodeAt(0) - "A".charCodeAt(0))))
      .join("");
  }

  private onMultiToggle = (optValue: string, checked: boolean) => {
    const currentValues = Array.isArray(this.selected) ? this.selected : [];
    let updatedValues: string[];
    if (checked) {
      updatedValues = currentValues.includes(optValue) ? currentValues : [...currentValues, optValue];
    } else {
      updatedValues = currentValues.filter((v) => v !== optValue);
    }

    this.selected = updatedValues;
    // TODO: validate multiselect if needed
    this.writeStore(this.field, updatedValues);
  };

  private onBlurFieldValidation = (e: Event) => {
    const input = e.target as HTMLInputElement | HTMLTextAreaElement;
    const val = input.value;

    const result = this.validateValue(val);
    const newErrors = { ...this.getErrors() };

    if (result.valid) {
      delete newErrors[this.field];
    } else {
      newErrors[this.field] = result.message;
    }

    this.setErrors(newErrors);
  };

  private onChangeFieldValidation = (newValue: string) => {
    this.selected = newValue;

    const result = this.validateValue(newValue);
    const newErrors = { ...this.getErrors() };

    if (result.valid) {
      delete newErrors[this.field];
      this.writeStore(this.field, newValue);
    } else {
      newErrors[this.field] = result.message;
    }

    this.setErrors(newErrors);
  };

  componentWillLoad() {
    if (!this.field) throw new Error('u-raw-field: "field" is required.');
    if (!this.type) throw new Error('u-raw-field: "type" is required.');

    const allowed: Set<string> = new Set(["text", "email", "tel", "password", "number", "date", "radio", "textarea", "select", "checkbox"]);
    if (!allowed.has(this.type)) {
      this.type = "text";
    }

    const current = this.readStore(this.field);
    const isType =
      this.type === "text" ||
      this.type === "email" ||
      this.type === "tel" ||
      this.type === "password" ||
      this.type === "number" ||
      this.type === "date" ||
      this.type === "textarea" ||
      this.type === "select";

    if (isType && (current === undefined || current === null) && typeof this.value === "string") {
      this.writeStore(this.field, this.value);
    }

    this.selected = current;
  }

  componentDidRender() {
    const errs = this.getErrors();
    if (errs?.[this.field]) {
      this.element.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${CSS.escape(this.field)}`)?.focus();
    }
  }

  render() {
    if (this.type === "radio") {
      if (Array.isArray(this.radioOptions) && this.radioOptions.length) {
        const checkedOptions = this.radioOptions.map((opt) => ({
          ...opt,
          checked: String(opt.value) === this.selected,
        }));
        return (
          <RadioGroup
            name={this.field}
            disabled={this.disabled}
            title={this.tooltip}
            type="radio"
            onChange={this.onChangeFieldValidation}
            options={checkedOptions}
            specificPartKey={this.specificPartKey}
            aria-describedby={this.ariaDescribedBy}
            required={this.required}
          />
        );
      }

      if (typeof this.value === "string") {
        const currentValue = this.readStore(this.field);
        const isChecked = currentValue != null && String(currentValue) === this.value;
        return (
          <RadioGroup
            name={this.field}
            value={this.value}
            checked={isChecked}
            disabled={this.disabled}
            title={this.tooltip}
            componentClassName={this.componentClassName}
            type="radio"
            specificPartKey={this.specificPartKey}
            onChange={this.onChangeFieldValidation}
            aria-describedby={this.ariaDescribedBy}
            required={this.required}
          />
        );
      }
    }

    if (this.type === "checkbox") {
      if (Array.isArray(this.multiSelectOptions) && this.multiSelectOptions.length) {
        const selected = Array.isArray(this.selected) ? this.selected : [];
        return (
          <MultiSelect
            value={selected}
            options={this.multiSelectOptions}
            disabled={this.disabled}
            title={this.tooltip}
            type="checkbox"
            specificPartKey={this.specificPartKey}
            onToggle={this.onMultiToggle}
            aria-describedby={this.ariaDescribedBy}
          />
        );
      }

      if (this.value) {
        const currentValue = (this.readStore(this.field) as string[]) ?? [];
        const isChecked = currentValue?.includes(this.value as string);
        return (
          <MultiSelect
            id={`${this.field}-${this.value}`}
            name={this.field}
            value={this.value as string}
            checked={isChecked}
            disabled={this.disabled}
            title={this.tooltip}
            componentClassName={this.componentClassName}
            type="checkbox"
            onToggle={(val, checked) => {
              const current = this.readStore(this.field) as string[];
              const updated = checked ? [...current, val] : current.filter((v) => v !== val);
              this.writeStore(this.field, updated);
            }}
            aria-describedby={this.ariaDescribedBy}
          />
        );
      }
    }

    if (this.type === "select") {
      const currentValue = (this.readStore(this.field) as string) ?? "";
      const option = this.getNormalizedOptions();
      return (
        <Select
          id={this.field}
          name={this.field}
          value={currentValue}
          options={option}
          disabled={this.disabled}
          title={this.tooltip}
          emptyOption={this.emptyOption}
          onChange={this.onChangeFieldValidation}
          componentClassName={this.componentClassName}
          countryCodeDisplayOption={this.countryCodeDisplayOption}
          countryIcon={this.countryIcon}
          attr_name={this.attrName}
          specificPartKey={this.specificPartKey}
          aria-describedby={this.ariaDescribedBy}
        />
      );
    }

    if (this.type === "textarea") {
      const currentValue = (this.readStore(this.field) as string) || "";
      return (
        <Textarea
          id={this.field}
          value={currentValue}
          required={this.required}
          disabled={this.disabled}
          title={this.tooltip}
          componentClassName={this.componentClassName}
          specificPartKey={this.specificPartKey}
          onChange={this.onChangeFieldValidation}
          onBlur={this.onBlurFieldValidation}
          aria-describedby={this.ariaDescribedBy}
        />
      );
    }

    const currentValue = (this.readStore(this.field) as string) || "";
    return (
      <Input
        id={this.field}
        value={currentValue}
        required={this.required}
        disabled={this.disabled}
        title={this.tooltip}
        type={this.type}
        componentClassName={this.componentClassName}
        placeholder={this.placeholder}
        specificPartKey={this.specificPartKey}
        onChange={this.onChangeFieldValidation}
        onBlur={this.onBlurFieldValidation}
        aria-describedby={this.ariaDescribedBy}
      />
    );
  }
}
