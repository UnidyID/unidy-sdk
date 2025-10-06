import { Component, Element, Prop, State, h } from "@stencil/core";
import { RadioGroup } from "./../raw-components/input-field/RadioGroup";
import { Textarea } from "./../raw-components/input-field/Textarea";
import { Input } from "./../raw-components/input-field/Input";
import { type ProfileRaw, state as profileState, type RadioOption } from "../../../store/profile-store";

@Component({
  tag: "unidy-raw-field",
  styleUrl: "unidy-raw-field.css",
  shadow: false,
})
export class UnidyRawField {
  @Prop() required = false;
  @Prop() readonlyPlaceholder = "";
  @Prop() countryCodeDisplayOption?: "icon" | "label" = "label";
  @Prop() invalidPhoneMessage = "Please enter a valid phone number.";
  @Prop() className?: string;

  @Prop() name!: string;
  @Prop() value?: string | string[];
  @Prop() checked?: boolean;
  @Prop() disabled?: boolean;
  @Prop() title!: string;
  @Prop() type!: string;
  @Prop() placeholder?: string;

  @Element() el!: HTMLElement;

  @State() selected?: string | string[];

  private readStore(name: string): string | undefined | string[] {
    if (!name) return;
    const data: ProfileRaw = profileState.data;

    if (!data) return;

    if (name.startsWith("custom_attributes.")) {
      const key = name.replace("custom_attributes.", "");
      const field = data.custom_attributes?.[key];
      if (!field) return;

      if (Array.isArray(field.radio_options)) {
        const checkedOption = field.radio_options.find((option: RadioOption) => option.checked);
        return checkedOption?.value ?? field.value ?? "";
      }
      return field.value;
    }
    if (data[name] === undefined) {
      console.log("Field not found in profile data:", name);
      console.log("Available fields:", Object.keys(data));
    }
    return data[name].value;
  }

  private writeStore(field: string, value: string | string[]) {
    if (!field) return;
    const data: ProfileRaw = profileState.data;
    if (!data) return;

    if (field.startsWith("custom_attributes.")) {
      const customAttributeFieldName = field.replace("custom_attributes.", "");
      const prev = data?.custom_attributes?.[customAttributeFieldName];
      const val = prev && typeof prev === "object" && "value" in prev ? { ...prev, value } : { value };

      profileState.data = {
        ...data,
        custom_attributes: { ...data.custom_attributes, [customAttributeFieldName]: val },
      };
    } else {
      const regularFieldName = field;
      const prev = data?.[regularFieldName];
      const val = prev && typeof prev === "object" && "value" in prev ? { ...prev, value } : { value };
      profileState.data = { ...data, [regularFieldName]: val };
    }
  }

  private onRadioChange = (val: string) => this.writeStore(this.name, val);
  private onTextChange = (val: string) => this.writeStore(this.name, val);

  componentWillLoad() {
    if (!this.name) throw new Error('unidy-raw-field: "name" is required.');
    if (!this.type) throw new Error('unidy-raw-field: "type" is required.');

    const allowed: Set<string> = new Set(["text", "email", "tel", "password", "number", "date", "radio", "textarea"]);
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
      this.type === "radio";

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
      const isChecked = String(currentValue) === this.value;
      return (
        <RadioGroup
          name={this.name}
          value={this.value}
          checked={isChecked}
          disabled={this.disabled}
          title={this.title}
          className={this.className}
          type="radio"
          onChange={this.onRadioChange}
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
          title={this.title}
          className={this.className}
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
        title={this.title}
        type={this.type}
        className={this.className}
        placeholder={this.placeholder}
        onChange={this.onTextChange}
        onInput={this.phoneFieldValidation}
      />
    );
  }
}
