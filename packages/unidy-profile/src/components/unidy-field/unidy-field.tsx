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
        <label htmlFor={this.field}>{fieldData?.label}</label>
      {fieldData.type === "select" && fieldData.options ? (
        <select id={this.field}>
          {fieldData.options.map((opt) => (
            <option value={opt.value} selected={opt.value === fieldData.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={this.field}
          type={fieldData.type}
          value={fieldData.value}
        />
      )}

        {this.store.state.errors[this.field] && <p style={{ color: "red" }}>ERROR: {this.store.state.errors[this.field]}</p>}
      </div>
    );
  }
}
