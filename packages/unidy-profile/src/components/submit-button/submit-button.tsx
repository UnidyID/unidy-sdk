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

  private async onSubmit () {
    const { configuration, ...stateWithoutConfig } = this.store.state;

    const idToken = this.store.state.idToken;
    const resp = await this.store.state.client?.profile.updateProfile(idToken, stateWithoutConfig.data);
    console.log("Update response:", resp);

    if (resp?.success) {
      this.store.state.configuration = JSON.parse(JSON.stringify(resp.data));
    } else {
      this.store.state.errors = { "status": String(resp?.status) };
    }
  };

  private hasSlotContent(): boolean {
    return this.el.hasChildNodes() && this.el.textContent?.trim() !== "";
  }

  render() {
    return (
      <div>
        <button onClick={() => this.onSubmit()} type="button" part="unidy-button">
          {this.hasSlotContent() ? <slot /> : "SUBMIT BY DEFAULT"}
        </button>
      </div>
    );
  }
}
