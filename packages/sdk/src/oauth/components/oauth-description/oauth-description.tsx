import { Component, Element, h, Host } from "@stencil/core";
import { getOAuthProvider } from "../context";
import { oauthState } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-description",
  shadow: false,
})
export class OAuthDescription {
  @Element() el!: HTMLElement;

  componentWillLoad() {
    if (!getOAuthProvider(this.el)) {
      console.warn("[u-oauth-description] Must be used inside a u-oauth-provider");
    }
  }

  render() {
    if (!oauthState.application?.description) {
      return null;
    }

    return (
      <Host id="oauth-modal-description">
        <slot>
          <p>{oauthState.application.description}</p>
        </slot>
      </Host>
    );
  }
}
