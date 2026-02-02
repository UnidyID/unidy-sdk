import { Component, Element, h, Prop } from "@stencil/core";
import { UnidyComponent } from "../../../logger";
import { oauthState } from "../../store/oauth-store";
import { getOAuthProvider } from "../context";

@Component({
  tag: "u-oauth-scopes",
  shadow: false,
})
export class OAuthScopes extends UnidyComponent() {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop({ attribute: "item-class-name" }) itemClassName = "";

  componentWillLoad() {
    if (!getOAuthProvider(this.el)) {
      this.logger.warn("Must be used inside a u-oauth-provider");
    }
  }

  render() {
    const scopes = oauthState.application?.scopes ?? [];

    if (scopes.length === 0) {
      return null;
    }

    return (
      <ul class={this.componentClassName}>
        {scopes.map((scope) => (
          <li key={scope.scope} class={this.itemClassName}>
            <span class="u-oauth-scope-name">{scope.name}</span>
          </li>
        ))}
      </ul>
    );
  }
}
