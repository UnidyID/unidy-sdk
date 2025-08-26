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

  @State() selected?: string;

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
    // TODO: handle errors, other types (e.g. multi-select, ...)

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
            onChange={(e) => this.onSelectChange((e.target as HTMLSelectElement).value)}
          >
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
          <div part="radio-group">
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
                  onChange={() => this.onRadioChange(opt.value)}
                  part="radio"
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
            required={this.required}
            part="input"
            onChange={(e) => {
              this.store.state.data[this.field] = {
                ...this.store.state.data[this.field],
                value: (e.target as HTMLInputElement).value,
              };
            }}
          />
        )}
        {this.store.state.errors[this.field] && (
          <p style={{ color: "red" }}>
            ERROR: {this.store.state.errors[this.field]}
          </p>
        )}
      </div>
    );
  }
}
