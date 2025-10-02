import { Component, Prop, h } from "@stencil/core";
import { unidyState } from "../../store/unidy-store";

@Component({
  tag: "unidy-config",
  shadow: false,
})
export class UnidyConfig {
  @Prop() baseUrl = "";
  @Prop() apiKey = "";

  componentWillLoad() {
    if (!this.baseUrl || !this.apiKey) {
      console.error("baseUrl and apiKey are required");
      return;
    }

    unidyState.apiKey = this.apiKey;
    unidyState.baseUrl = this.baseUrl;
  }

  render() {
    return <slot />;
  }
}
