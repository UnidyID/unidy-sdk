import { Component, Prop, h } from "@stencil/core";
import { unidyState } from "../../../store/unidy-store";
import { Auth } from "../../../auth";
import { getUnidyClient } from "../../../api-client";

@Component({
  tag: "u-config",
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

    Auth.initialize(getUnidyClient());
  }

  render() {
    return <slot />;
  }
}
