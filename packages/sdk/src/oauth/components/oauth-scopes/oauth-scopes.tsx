import { Component, h, Prop } from "@stencil/core";
import { oauthState } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-scopes",
  shadow: false,
})
export class OAuthScopes {
  /** CSS classes to apply to the scopes list container. */
  @Prop({ attribute: "class-name" }) componentClassName = "";
  /** CSS classes to apply to each scope list item. */
  @Prop({ attribute: "item-class-name" }) itemClassName = "";

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
