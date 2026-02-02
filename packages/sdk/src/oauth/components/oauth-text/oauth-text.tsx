import { Component, Element, h, Prop } from "@stencil/core";
import { UnidyComponent } from "../../../logger";
import { oauthState } from "../../store/oauth-store";
import { getOAuthProvider } from "../context";

export type OAuthTextType = "title" | "description";

@Component({
  tag: "u-oauth-text",
  shadow: false,
})
export class OAuthText extends UnidyComponent() {
  @Element() el!: HTMLElement;

  @Prop() type: OAuthTextType = "title";

  componentWillLoad() {
    if (!getOAuthProvider(this.el)) {
      this.logger.warn("Must be used inside a u-oauth-provider");
    }
  }

  render() {
    if (!oauthState.application) {
      return null;
    }

    if (this.type === "title") {
      return <span id="oauth-modal-title">{oauthState.application.name}</span>;
    }

    if (!oauthState.application.description) {
      return null;
    }

    return <span id="oauth-modal-description">{oauthState.application.description}</span>;
  }
}
