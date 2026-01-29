import { Component, Element, h, Host, Prop } from "@stencil/core";
import { getOAuthProvider } from "../context";
import { oauthState } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-scopes",
  shadow: false,
})
export class OAuthScopes {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName = "";

  componentWillLoad() {
    if (!getOAuthProvider(this.el)) {
      console.warn("[u-oauth-scopes] Must be used inside a u-oauth-provider");
    }
  }

  render() {
    const scopes = oauthState.application?.scopes ?? [];

    if (scopes.length === 0) {
      return null;
    }

    return (
      <Host>
        <ul class={this.componentClassName} role="list">
          {scopes.map((scope) => (
            <li key={scope.scope}>
              <span class="u-oauth-scope-name">{scope.name}</span>
            </li>
          ))}
        </ul>
      </Host>
    );
  }
}
