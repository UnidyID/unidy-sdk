import { Component, h, Prop } from "@stencil/core";
import { oauthState } from "../../store/oauth-store";

export type OAuthTextType = "title" | "description";

@Component({
  tag: "u-oauth-text",
  shadow: false,
})
export class OAuthText {
  /** The type of text to display: "title" for application name, "description" for application description. */
  @Prop() type: OAuthTextType = "title";

  render() {
    const app = oauthState.application;
    if (!app) return null;

    const text = this.type === "title" ? app.name : app.description;
    return text ? <span>{text}</span> : null;
  }
}
