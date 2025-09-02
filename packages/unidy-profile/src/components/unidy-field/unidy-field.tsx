import { Component, Element, Prop, State, h } from "@stencil/core";

@Component({
  tag: "unidy-field",
  styleUrl: "unidy-field.css",
  shadow: true,
})
export class UnidyField {
  @Prop() field!: string;
  @Prop() required = false;

  @Element() el!: HTMLElement;

  @State() selected?: string | string[];

  private get store() {
    const container = this.el.closest("unidy-profile");
    if (!container) {
      throw new Error("unidy-field must be inside an unidy-profile");
    }
    return container.store;
  }

  componentWillLoad() {
    const fieldData = this.store.state.data[this.field];
    if (fieldData?.radioOptions?.length) {
      const checkedOption = fieldData.radioOptions.find(option => option.checked);
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

  private onRadioChange = (value: string) => {
    this.selected = value;

    const storeState = this.store.state;
    const fieldData = storeState.data[this.field];
    if (!fieldData?.radioOptions) return;

    const updatedRadioOptions = fieldData.radioOptions.map(option => ({
      ...option,
      checked: option.value === value,
    }));

    const updatedField = {
      ...fieldData,
      value,
      radioOptions: updatedRadioOptions,
    };

    this.store.state.data = {
      ...storeState.data,
      [this.field]: updatedField,
    };
  };

  private onSelectChange = (value: string) => {
    this.selected = value;

    const storeState = this.store.state;
    const fieldData = storeState.data[this.field];
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

    this.store.state.data = {
      ...storeState.data,
      [this.field]: updatedField,
    };
  };

  render() {
    if (this.store.state.loading) {
      return <div class="spinner"/>;
    }

    const fieldData = this.store.state.data[this.field];
    const isLocked = fieldData?.locked?.locked === true;
    const lockedText = fieldData?.locked?.locked_text ? fieldData.locked.locked_text : "";
    // TODO: Add other types

    return (
      <div>
        <label htmlFor={this.field} part="label">
          {fieldData?.label}
          {fieldData?.required || this.required ? <span part="required-indicator"> *</span> : null}
        </label>
        {fieldData.type === "select" && fieldData.options ? (
          <select
            id={this.field}
            data-value={fieldData.value}
            part="select"
            disabled={isLocked}
            title={isLocked ? lockedText : undefined}
            onChange={(e) => this.onSelectChange((e.target as HTMLSelectElement).value)}
          >
            <option value="" selected={fieldData.value === null || fieldData.value === ""}/>
            {fieldData.options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                data-selected={opt.value === fieldData.value ? "true" : "false"}
                selected={opt.value === fieldData.value}
                part="option"
              >
                {opt.label}
              </option>
            ))}
          </select>
        ) : fieldData.radioOptions ? (
          <div part="radio-group" title={isLocked ? lockedText : undefined}>
            {fieldData.radioOptions.map((opt) => (
              <label
                key={opt.value}
                part={`radio-label ${opt.checked ? "radio-checked" : ""}`}
                data-checked={opt.checked ? "true" : "false"}
              >
                <input
                  type={fieldData.type}
                  name={this.field}
                  value={opt.value}
                  checked={opt.checked}
                  disabled={isLocked}
                  onChange={() => this.onRadioChange(opt.value)}
                  part="radio"
                />
                {opt.label}
              </label>
            ))}
          </div>
        ) : fieldData.type === "checkbox" && fieldData.options ? (
          <div part="checkbox-group" title={isLocked ? lockedText : undefined}>
            {fieldData.options.map((opt) => (
              <label key={opt.value} part="checkbox-label">
                <input
                  id={opt.value}
                  type={fieldData.type}
                  checked={Array.isArray(fieldData.value) && fieldData.value.includes(opt.value)}
                  disabled={isLocked}
                  title={isLocked ? lockedText : undefined}
                  onChange={(e) => {
                    const prev = (this.store.state.data[this.field]?.value as string[]) ?? [];
                    const value = (e.target as HTMLInputElement).checked
                      ? (prev.includes(opt.value) ? prev : [...prev, opt.value])
                      : prev.filter(v => v !== opt.value);

                    this.store.state.data[this.field] = {
                      ...this.store.state.data[this.field],
                      value,
                    };
                  }}
                  part="checkbox"
                />
                {opt.label}
              </label>
            ))}
          </div>
        ) : (
          <input
            id={this.field}
            type={fieldData.type}
            value={fieldData.value}
            class={this.store.state.errors[this.field] ? 'field-error' : ''}
            required={fieldData?.required || this.required}
            part="input"
            disabled={isLocked}
            title={isLocked ? lockedText : undefined}
            onChange={(e) => {
              this.store.state.data[this.field] = {
                ...this.store.state.data[this.field],
                value: (e.target as HTMLInputElement).value,
              };
            }}
          />
        )}
        {this.store.state.errors[this.field] && (
          <span part="field-error-message">
            ERROR: {this.store.state.errors[this.field]}
          </span>
        )}
      </div>
    );
  }
}
