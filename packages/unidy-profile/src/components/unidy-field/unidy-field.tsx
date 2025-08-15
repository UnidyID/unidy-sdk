import { Component, Element, Prop, State, h } from "@stencil/core";

@Component({
  tag: "unidy-field",
  styleUrl: "unidy-field.css",
  shadow: true,
})
export class UnidyField {
  @Prop() field!: string;
  @Prop() required: boolean = false;

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

  render() {
    if (this.store.state.loading) {
      return <p>Loading...</p>;
    }

    const fieldData = this.store.state.data[this.field];
    // TODO: handle errors, other types (e.g. multi-select, ...)

    return (
      <div>
        <label htmlFor={this.field} part="label">
          {fieldData?.label}
          {this.required ? <span part="required-indicator"> *</span> : null}
        </label>
        {fieldData.type === "select" && fieldData.options ? (
          <select id={this.field} part="select">
            {fieldData.options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
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
