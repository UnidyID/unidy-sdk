import { Component, Element, h, Host, State } from "@stencil/core";
import { getOAuthProvider } from "../context";
import { oauthState, onChange } from "../../store/oauth-store";
import type { OAuthApplication } from "../../api/oauth";

@Component({
  tag: "u-oauth-description",
  shadow: false,
})
export class OAuthDescription {
  @Element() el!: HTMLElement;

  @State() private application: OAuthApplication | null = null;

  private unsubscribers: Array<() => void> = [];

  componentWillLoad() {
    const provider = getOAuthProvider(this.el);

    if (!provider) {
      console.warn("[u-oauth-description] Must be used inside a u-oauth-provider");
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

  render() {
    if (!this.application?.description) {
      return null;
    }

    return (
      <Host id="oauth-modal-description">
        <slot>
          <p>{this.application.description}</p>
        </slot>
      </Host>
    );
  }
}
