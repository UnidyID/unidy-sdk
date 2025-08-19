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
    const { configuration, ...stateWithoutConfig } = this.store.state;

    const idToken = this.store.state.idToken;
    this.store.state.client?.profile.updateProfile(idToken, stateWithoutConfig.data);
  };

  private hasSlotContent(): boolean {
    return this.el.hasChildNodes() && this.el.textContent?.trim() !== "";
  }

  render() {
    return (
      <button onClick={this.onSubmit} type="button" part="unidy-button">
        {this.hasSlotContent() ? <slot /> : "SUBMIT BY DEFAULT"}
      </button>
    );
  }
}
