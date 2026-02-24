import { Component, Event, type EventEmitter, h, Prop, State } from "@stencil/core";
import { newsletterStore } from "../../../newsletter/store/newsletter-store";
import { type ProfileNode, type ProfileRaw, state as profileState } from "../../../profile/store/profile-store";
import { onChange as onRegistrationChange, registrationState, registrationStore } from "../../../registration/store/registration-store";
import { UnidyComponent } from "../../base/component";
import { type ComponentContext, detectContext } from "../../context-utils";
import { Input } from "./components/Input";
import { MultiSelect, type MultiSelectOption } from "./components/MultiSelect";
import { RadioGroup, type RadioOption } from "./components/RadioGroup";
import { type Option, Select } from "./components/Select";
import { Textarea } from "./components/Textarea";

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

  /** Emitted when the user presses Enter (or Cmd/Ctrl+Enter in textareas) to submit the field value. */
  @Event({ bubbles: true, composed: true }) uFieldSubmit!: EventEmitter<{ field: string }>;

  @State() selected?: string | string[];

  private unsubscribers: (() => void)[] = [];

  // Subscribe to password changes so the confirmation field re-validates when the password changes
  connectedCallback() {
    if (this.field === "password_confirmation") {
      this.unsubscribers.push(
        onRegistrationChange("password", () => {
          if (this.context === "registration" && registrationState.passwordConfirmation) {
            this.onInputField(registrationState.passwordConfirmation);
          }
        }),
      );
    }
  }

  disconnectedCallback() {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }

  private get context(): ComponentContext | null {
    return detectContext(this.element);
  }

  private readStore(fieldName: string): string | undefined | string[] {
    if (!fieldName) return;

    switch (this.context) {
      case "newsletter":
        return this.readNewsletterStore(fieldName);
      case "registration":
        return this.readRegistrationStore(fieldName);
      default:
        return this.readProfileStore(fieldName);
    }
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

  private readRegistrationStore(fieldName: string): string | undefined | string[] {
    if (fieldName === "email") {
      return registrationState.email || "";
    }

    if (fieldName === "password") {
      return registrationState.password || "";
    }

    if (fieldName === "password_confirmation") {
      return registrationState.passwordConfirmation || "";
    }

    if (fieldName.startsWith("custom_attributes.")) {
      const key = fieldName.replace("custom_attributes.", "");
      const value = registrationState.customAttributes[key];
      return value != null ? String(value) : "";
    }

    const value = registrationState.profileData[fieldName];
    return value != null ? String(value) : "";
  }

  private writeStore(fieldName: string, value: string | string[]) {
    if (!fieldName) return;

    switch (this.context) {
      case "newsletter":
        this.writeNewsletterStore(fieldName, value);
        break;
      case "registration":
        this.writeRegistrationStore(fieldName, value);
        break;
      default:
        this.writeProfileStore(fieldName, value);
        break;
    }
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

  private writeRegistrationStore(fieldName: string, value: string | string[]) {
    const stringValue = Array.isArray(value) ? value.join(",") : value;

    if (fieldName === "email") {
      registrationStore.setEmail(stringValue);
      return;
    }

    if (fieldName === "password") {
      registrationStore.setPassword(stringValue);
      return;
    }

    if (fieldName === "password_confirmation") {
      registrationStore.setPasswordConfirmation(stringValue);
      return;
    }

    if (fieldName.startsWith("custom_attributes.")) {
      const key = fieldName.replace("custom_attributes.", "");
      registrationStore.setCustomAttribute(key, stringValue);
      return;
    }

    registrationStore.setProfileField(fieldName, stringValue);
  }

  private getErrors(): Record<string, string> {
    switch (this.context) {
      case "newsletter":
        return newsletterStore.state.additionalFieldErrors;
      case "registration":
        return registrationState.errors as Record<string, string>;
      default:
        return profileState.errors;
    }
  }

  private setErrors(errors: Record<string, string>) {
    switch (this.context) {
      case "newsletter":
        newsletterStore.state.additionalFieldErrors = errors;
        break;
      case "registration": {
        // Clear fields that were removed from the errors object, then set remaining ones
        const currentErrors = registrationState.errors as Record<string, string>;
        for (const field of Object.keys(currentErrors)) {
          if (!(field in errors)) {
            registrationStore.clearFieldError(field);
          }
        }
        for (const [field, error] of Object.entries(errors)) {
          if (error) {
            registrationStore.setFieldError(field, error);
          } else {
            registrationStore.clearFieldError(field);
          }
        }
        break;
      }
      default:
        profileState.errors = errors;
        break;
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
        return { valid: false, message: "field_required" };
      }
    }

    if (this.pattern && typeof value === "string") {
      const regex = new RegExp(this.pattern);
      if (!regex.test(value)) {
        return { valid: false, message: this.patternErrorMessage || "invalid_format" };
      }
    }

    const externalResult = this.runExternalValidator(value);

    if (externalResult && !externalResult.valid) {
      return { valid: false, message: externalResult.message || "invalid_input" };
    }

    if (this.type === "tel") {
      const phonePattern = /^(?=.{4,13}$)(\+\d+|\d+)$/;
      if (typeof value === "string" && value !== "" && !phonePattern.test(value)) {
        return { valid: false, message: this.invalidPhoneMessage || "invalid_phone" };
      }
    }

    // Password confirmation match validation (registration context only)
    if (this.context === "registration" && this.field === "password_confirmation" && typeof value === "string" && value !== "") {
      if (value !== registrationState.password) {
        return { valid: false, message: "passwords_do_not_match" };
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

  private onFocusField = () => {
    if (this.context !== "newsletter") {
      profileState.activeField = this.field;
    }
  };

  private onBlurField = (e: Event) => {
    if (this.context !== "newsletter") {
      profileState.activeField = null;
    }

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

  private onBlurSelect = () => {
    if (this.context !== "newsletter") {
      profileState.activeField = null;
    }
  };

  private clearFieldSavedState() {
    if (this.context !== "newsletter" && profileState.fieldSaveStates[this.field] === "saved") {
      profileState.fieldSaveStates = {
        ...profileState.fieldSaveStates,
        [this.field]: "idle",
      };
    }
  }

  private onInputField = (newValue: string) => {
    this.selected = newValue;
    this.clearFieldSavedState();

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

  private onChangeSelect = (newValue: string) => {
    this.selected = newValue;
    this.clearFieldSavedState();

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

  private onEnterSubmit = () => {
    if (!this.getErrors()[this.field]) {
      this.uFieldSubmit.emit({ field: this.field });
    }
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
            onChange={this.onChangeSelect}
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
            onChange={this.onChangeSelect}
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
          onChange={this.onChangeSelect}
          onFocus={this.onFocusField}
          onBlur={this.onBlurSelect}
          onEnterSubmit={this.onEnterSubmit}
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
          onInput={this.onInputField}
          onFocus={this.onFocusField}
          onBlur={this.onBlurField}
          onEnterSubmit={this.onEnterSubmit}
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
        onInput={this.onInputField}
        onFocus={this.onFocusField}
        onBlur={this.onBlurField}
        onEnterSubmit={this.onEnterSubmit}
        aria-describedby={this.ariaDescribedBy}
      />
    );
  }
}
