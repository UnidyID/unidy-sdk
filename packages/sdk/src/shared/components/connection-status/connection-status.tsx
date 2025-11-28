import { Component, Host, Prop, h } from "@stencil/core";
import { unidyState } from "../../store/unidy-store";

@Component({
  tag: "u-connection-status",
  shadow: true,
})
export class ConnectionStatus {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  render() {
    if (unidyState.backendConnected) {
      return null;
    }

    return (
      <Host class={this.componentClassName}>
        <slot />
      </Host>
    );
  }
}

