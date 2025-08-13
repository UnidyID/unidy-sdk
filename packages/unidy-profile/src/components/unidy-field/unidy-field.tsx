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

    return (
      <div>
        <label htmlFor={this.field}>{this.field}</label>
        <input
          id={this.field}
          value={this.store.state.data[this.field]}
          onChange={(e) => {
            this.store.state.data[this.field] = (e.target as HTMLInputElement).value;
          }}
        />

        {this.store.state.errors[this.field] && <p style={{ color: "red" }}>ERROR: {this.store.state.errors[this.field]}</p>}
      </div>
    );
  }
}
