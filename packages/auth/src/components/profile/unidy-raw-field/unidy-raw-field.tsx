import { Component, Element, Prop, State, h } from "@stencil/core";
import { RadioGroup } from "../raw-input-fields/RadioGroup";
import { Textarea } from "../raw-input-fields/Textarea";
import { Input } from "../raw-input-fields/Input";
import { type ProfileNode, type ProfileRaw, state as profileState, type RadioOption } from "../../../store/profile-store";
import { Select } from "../raw-input-fields/Select";
import { MultiSelect } from "../raw-input-fields/MultiSelect";

export type Option = { value: string; label: string; selected?: boolean };

@Component({
  tag: "unidy-raw-field",
  shadow: false,
})
export class UnidyRawField {
  @Prop() required = false;
  @Prop() readonlyPlaceholder = "";
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";
  @Prop() invalidPhoneMessage = "Please enter a valid phone number.";
  @Prop() customStyle?: string;

  @Prop() name!: string;
  @Prop() value?: string | string[];
  @Prop() checked?: boolean;
  @Prop() disabled?: boolean;
  @Prop() tooltip?: string;
  @Prop() type!: string;
  @Prop() placeholder?: string;
  @Prop() options?: string | Option[];
  @Prop() emptyOption = false;

  @Element() el!: HTMLElement;

  @State() selected?: string | string[];

  private readStore(name: string): string | undefined | string[] {
    if (!name) return;
    const data: ProfileRaw = profileState.data;

    if (!data) return;

    let field: ProfileNode | undefined;

    if (name.startsWith("custom_attributes.")) {
      const key = name.replace("custom_attributes.", "");
      field = data.custom_attributes?.[key];
    } else {
      field = data[name];
    }

    if (!field) return;

    if (field.radio_options) {
      const checkedOption = field.radio_options.find((option: RadioOption) => option.checked);
      return checkedOption?.value ?? field.value ?? "";
    }

    if (field.type === "checkbox") {
      return Array.isArray(field.value) ? field.value : [];
    }

    return field.value;
  }

  private writeStore(fieldName: string, value: string | string[] | undefined) {
    if (!fieldName) return;
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

  private getNormalizedOptions(): Option[] {
    if (Array.isArray(this.options)) return this.options;

    // unidy-raw-field select-options prop can be a JSON string
    if (typeof this.options === 'string') return JSON.parse(this.options);

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


  private onRadioChange = (val: string) => this.writeStore(this.name, val);
  private onSelectChange = (val: string) => this.writeStore(this.name, val);
  private onTextChange = (val: string) => this.writeStore(this.name, val);

  componentWillLoad() {
    if (!this.name) throw new Error('unidy-raw-field: "name" is required.');
    if (!this.type) throw new Error('unidy-raw-field: "type" is required.');

    const allowed: Set<string> = new Set(["text", "email", "tel", "password", "number", "date", "radio", "textarea", "select", "checkbox"]);
    if (!allowed.has(this.type)) {
      this.type = "text";
    }

    const current = this.readStore(this.name);
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
      this.writeStore(this.name, this.value);
    }
  }

  componentDidRender() {
    const errs = profileState.errors;
    if (errs?.[this.name]) {
      this.el.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${CSS.escape(this.name)}`)?.focus();
    }
  }

  private phoneFieldValidation = (e: Event) => {
    if (this.type !== "tel") return;
    const input = e.target as HTMLInputElement;
    const pattern = /^(?=.{4,13}$)(\+\d+|\d+)$/;
    if (input.value !== "" && !pattern.test(input.value)) {
      input.setCustomValidity(this.invalidPhoneMessage);
      input.reportValidity();
      profileState.phoneValid = false;
    } else {
      input.setCustomValidity("");
      profileState.phoneValid = true;
    }
  };

  render() {
    if (this.type === "radio" && typeof this.value === "string") {
      const currentValue = this.readStore(this.name);
      const isChecked = currentValue != null && String(currentValue) === this.value;
      return (
        <RadioGroup
          name={this.name}
          value={this.value}
          checked={isChecked}
          disabled={this.disabled}
          title={this.tooltip}
          customStyle={this.customStyle}
          type="radio"
          onChange={this.onRadioChange}
        />
      );
    }

    if (this.type === "checkbox" && this.value) {
      const currentValue = (this.readStore(this.name) as string[]) ?? [];
      const isChecked = currentValue?.includes(this.value as string);
      return (
        <MultiSelect
          id={`${this.name}-${this.value}`}
          name={this.name}
          value={this.value as string}
          checked={isChecked}
          disabled={this.disabled}
          title={this.tooltip}
          customStyle={this.customStyle}
          type="checkbox"
          onToggle={(val, checked) => {
            const current = this.readStore(this.name) as string[];
            const updated = checked ? [...current, val] : current.filter((v) => v !== val);
            this.writeStore(this.name, updated);
          }}
        />
      );
    }

    if (this.type === "select") {
      const currentValue = (this.readStore(this.name) as string) ?? "";
      const option = this.getNormalizedOptions();
      return (
        <Select
          id={this.name}
          name={this.name}
          value={currentValue}
          options={option}
          disabled={this.disabled}
          title={this.tooltip}
          emptyOption={this.emptyOption}
          onChange={this.onSelectChange}
          customStyle={this.customStyle}
          countryCodeDisplayOption={this.countryCodeDisplayOption}
          countryIcon={this.countryIcon}
        />
      );
    }

    if (this.type === "textarea") {
      const currentValue = (this.readStore(this.name) as string) || "";
      return (
        <Textarea
          id={this.name}
          value={currentValue}
          required={this.required}
          disabled={this.disabled}
          title={this.tooltip}
          customStyle={this.customStyle}
          onChange={this.onTextChange}
        />
      );
    }

    const currentValue = (this.readStore(this.name) as string) || "";
    return (
      <Input
        id={this.name}
        value={currentValue}
        required={this.required}
        disabled={this.disabled}
        title={this.tooltip}
        type={this.type}
        customStyle={this.customStyle}
        placeholder={this.placeholder}
        onChange={this.onTextChange}
        onInput={this.phoneFieldValidation}
      />
    );
  }
}
