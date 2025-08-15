import { Component, Element, Prop, h } from "@stencil/core";

@Component({
  tag: "unidy-field",
  styleUrl: "unidy-field.css",
  shadow: true,
})
export class UnidyField {
  @Prop() field!: string;

  @Element() el!: HTMLElement;

  private get store() {
    const container = this.el.closest("unidy-profile");
    if (!container) {
      throw new Error("unidy-field must be inside an unidy-profile");
    }

    return container.store;
  }

  render() {
    if (this.store.state.loading) {
      return <p>Loading...</p>;
    }

     const fieldData = this.store.state.data[this.field];
     // TODO: handle errors, other types (e.g. radio, ...)

    return (
      <div>
        <label htmlFor={this.field} part="label">{fieldData?.label}</label>
      {fieldData.type === "select" && fieldData.options ? (
        <select id={this.field} part="select">
          {fieldData.options.map((opt) => (
            <option key={opt.value} value={opt.value} selected={opt.value === fieldData.value} part="option">{opt.label}</option>
          ))}
        </select>
      ) : fieldData.radioOptions ? (
        <div>
          {fieldData.radioOptions.map((opt) => (
            <label key={opt.value}>
              <input
                type={fieldData.type}
                name={this.field}
                value={opt.value}
                checked={opt.checked}
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
          part="input"
        />
      )}

        {this.store.state.errors[this.field] && <p style={{ color: "red" }}>ERROR: {this.store.state.errors[this.field]}</p>}
      </div>
    );
  }
}
