import { Component, Element, h, Host, Prop, State } from "@stencil/core";
import { getOAuthProvider } from "../context";
import { oauthState, onChange } from "../../store/oauth-store";
import type { OAuthApplication, OAuthScope } from "../../api/oauth";

@Component({
  tag: "u-oauth-scopes",
  shadow: false,
})
export class OAuthScopes {
  @Element() el!: HTMLElement;

  /**
   * Custom CSS class name(s) to apply to the list element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() private application: OAuthApplication | null = null;

  private unsubscribers: Array<() => void> = [];

  componentWillLoad() {
    const provider = getOAuthProvider(this.el);

    if (!provider) {
      console.warn("[u-oauth-scopes] Must be used inside a u-oauth-provider");
      return;
    }

    this.application = oauthState.application;

    this.unsubscribers.push(
      onChange("application", (app) => {
        this.application = app;
      })
    );
  }

  disconnectedCallback() {
    this.unsubscribers.forEach((unsub) => unsub());
  }

  private renderScope(scope: OAuthScope) {
    return (
      <li key={scope.scope}>
        <span class="u-oauth-scope-name">{scope.name}</span>
      </li>
    );
  }

  render() {
    const scopes = this.application?.scopes ?? [];

    if (scopes.length === 0) {
      return null;
    }

    return (
      <Host>
        <ul class={this.componentClassName} role="list">
          {scopes.map((scope) => this.renderScope(scope))}
        </ul>
      </Host>
    );
  }
}
