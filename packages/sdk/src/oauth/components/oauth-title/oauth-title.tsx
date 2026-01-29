import { Component, Element, Host, h, State } from "@stencil/core";
import type { OAuthApplication } from "../../api/oauth";
import { oauthState, onChange } from "../../store/oauth-store";
import { getOAuthProvider } from "../context";

@Component({
  tag: "u-oauth-title",
  shadow: false,
})
export class OAuthTitle {
  @Element() el!: HTMLElement;

  @State() private application: OAuthApplication | null = null;

  private unsubscribers: Array<() => void> = [];

  componentWillLoad() {
    const provider = getOAuthProvider(this.el);

    if (!provider) {
      console.warn("[u-oauth-title] Must be used inside a u-oauth-provider");
      return;
    }

    this.application = oauthState.application;

    this.unsubscribers.push(
      onChange("application", (app) => {
        this.application = app;
      }),
    );
  }

  disconnectedCallback() {
    this.unsubscribers.forEach((unsub) => unsub());
  }

  render() {
    if (!this.application) {
      return null;
    }

    return (
      <Host id="oauth-modal-title">
        <slot>
          <span>{this.application.name}</span>
        </slot>
      </Host>
    );
  }
}
