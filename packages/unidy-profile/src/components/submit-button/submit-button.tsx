import { Component, Element, h } from "@stencil/core";

@Component({
  tag: "submit-button",
  styleUrl: "submit-button.css",
  shadow: true,
})
export class SubmitButton {
  @Element() el!: HTMLElement;

  private get store() {
    const container = this.el.closest("unidy-profile");
    if (!container) {
      throw new Error("submit-button must be inside an unidy-profile");
    }

    return container.store;
  }

  private onSubmit = () => {
    alert(JSON.stringify(this.store.state));
  };

  private hasSlotContent(): boolean {
    return this.el.hasChildNodes() && this.el.textContent?.trim() !== "";
  }

  render() {
    return (
      <button onClick={this.onSubmit} type="button" style={{ backgroundColor: "red", color: "white" }}>
        {this.hasSlotContent() ? <slot /> : "SUBMIT BY DEFAULT"}
      </button>
    );
  }
}
