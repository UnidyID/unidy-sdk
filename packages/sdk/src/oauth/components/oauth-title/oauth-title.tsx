import { Component, Element, h, Host } from "@stencil/core";
import { getOAuthProvider } from "../context";
import { oauthState } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-title",
  shadow: false,
})
export class OAuthTitle {
  @Element() el!: HTMLElement;

  componentWillLoad() {
    if (!getOAuthProvider(this.el)) {
      console.warn("[u-oauth-title] Must be used inside a u-oauth-provider");
    }
  }

  render() {
    if (!oauthState.application) {
      return null;
    }

    return (
      <Host id="oauth-modal-title">
        <slot>
          <span>{oauthState.application.name}</span>
        </slot>
      </Host>
    );
  }
}
