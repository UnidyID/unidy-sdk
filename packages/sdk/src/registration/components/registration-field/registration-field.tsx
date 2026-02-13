import { Component, h, Prop, State, Element } from "@stencil/core";
import { registrationState, registrationStore } from "../../store/registration-store";
import { getParentRegistrationStep } from "../helpers";

type Option = {
  label: string;
  value: string;
};

@Component({
  tag: "u-registration-field",
  styleUrl: "registration-field.css",
  shadow: false,
})
export class RegistrationField {
  @Element() el!: HTMLElement;

  @Prop() field!: string;
  @Prop() type?: string;
  @Prop() placeholder?: string;
  @Prop() required = false;
  @Prop() options?: string | Option[];
  @Prop() pattern?: string;
  @Prop({ attribute: "pattern-error-message" }) patternErrorMessage?: string;
  @Prop({ attribute: "class-name" }) componentClassName?: string;
  @Prop({ attribute: "aria-described-by" }) ariaDescribedBy?: string;

  @State() localValue: string = "";

  componentWillLoad() {
    if (!this.field) {
      throw new Error('[u-registration-field] "field" prop is required.');
    }

    this.localValue = this.readFromStore();
  }

  private getFieldType(): string {
    if (this.type) return this.type;

    switch (this.field) {
      case "email":
        return "email";
      case "password":
        return "password";
      case "phone":
        return "tel";
      case "date_of_birth":
        return "date";
      default:
        if (this.options) return "select";
        return "text";
    }
  }

  private readFromStore(): string {
    const field = this.field;

    if (field === "email") {
      return registrationState.email || "";
    }

    if (field === "password") {
      return registrationState.password || "";
    }

    if (field.startsWith("custom_attributes.")) {
      const key = field.replace("custom_attributes.", "");
      return String(registrationState.customAttributes[key] || "");
    }

    return String(registrationState.profileData[field] || "");
  }

  private writeToStore(value: string): void {
    const field = this.field;

    if (field === "email") {
      registrationStore.setEmail(value);
      return;
    }

    if (field === "password") {
      registrationStore.setPassword(value);
      return;
    }

    if (field.startsWith("custom_attributes.")) {
      const key = field.replace("custom_attributes.", "");
      registrationStore.setCustomAttribute(key, value);
      return;
    }

    registrationStore.setProfileField(field, value);
  }

  private validateValue(value: string): { valid: boolean; message: string } {
    if (this.required && !value) {
      return { valid: false, message: "This field is required." };
    }

    if (this.pattern && value) {
      const regex = new RegExp(this.pattern);
      if (!regex.test(value)) {
        return { valid: false, message: this.patternErrorMessage || "Invalid format." };
      }
    }

    if (this.getFieldType() === "email" && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return { valid: false, message: "Please enter a valid email address." };
      }
    }

    return { valid: true, message: "" };
  }

  private handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement | HTMLSelectElement;
    const value = input.value;

    this.localValue = value;
    this.writeToStore(value);
    registrationStore.clearFieldError(this.field);
  };

  private handleBlur = () => {
    const result = this.validateValue(this.localValue);

    if (!result.valid) {
      registrationStore.setFieldError(this.field, result.message);
    } else {
      registrationStore.clearFieldError(this.field);
    }
  };

  private handleSubmit = async (e: Event) => {
    e.preventDefault();
    (await getParentRegistrationStep(this.el))?.submit();
  };

  private getNormalizedOptions(): Option[] {
    if (!this.options) return [];

    if (Array.isArray(this.options)) {
      return this.options;
    }

    try {
      return JSON.parse(this.options);
    } catch {
      return [];
    }
  }

  render() {
    const fieldType = this.getFieldType();

    if (fieldType === "select") {
      const options = this.getNormalizedOptions();

      return (
        <select
          id={this.field}
          name={this.field}
          required={this.required}
          disabled={registrationState.loading}
          class={this.componentClassName}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          aria-describedby={this.ariaDescribedBy}
        >
          <option value="" selected={!this.localValue}>{this.placeholder || "Select..."}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} selected={this.localValue === opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <form onSubmit={this.handleSubmit}>
        <input
          id={this.field}
          type={fieldType}
          name={this.field}
          value={this.localValue}
          placeholder={this.placeholder}
          required={this.required}
          disabled={registrationState.loading}
          class={this.componentClassName}
          onInput={this.handleChange}
          onBlur={this.handleBlur}
          aria-describedby={this.ariaDescribedBy}
        />
      </form>
    );
  }
}
