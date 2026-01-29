import { Component, Element, h, Host, Prop, State } from "@stencil/core";
import { getOAuthProvider } from "../context";
import { oauthState, onChange } from "../../store/oauth-store";
import { unidyState } from "../../../shared/store/unidy-store";
import type { OAuthApplication } from "../../api/oauth";

@Component({
  tag: "u-oauth-logo",
  shadow: false,
})
export class OAuthLogo {
  @Element() el!: HTMLElement;

  /**
   * Custom CSS class name(s) to apply to the image element.
   */
  @Prop({ attribute: "class-name" }) componentClassName = "";

  /**
   * Width of the logo image.
   */
  @Prop() width = "64";

  /**
   * Height of the logo image.
   */
  @Prop() height = "64";

  @State() private application: OAuthApplication | null = null;

  private unsubscribers: Array<() => void> = [];

  componentWillLoad() {
    const provider = getOAuthProvider(this.el);

    if (!provider) {
      console.warn("[u-oauth-logo] Must be used inside a u-oauth-provider");
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

  private getLogoUrl(): string | null {
    const logoUrl = this.application?.logo_url;
    if (!logoUrl) return null;

    // If it's already an absolute URL, use it directly
    if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
      return logoUrl;
    }

    // Otherwise prepend the base URL
    const baseUrl = unidyState.baseUrl?.replace(/\/$/, "") ?? "";
    return `${baseUrl}${logoUrl}`;
  }

  render() {
    const logoUrl = this.getLogoUrl();
    if (!logoUrl) {
      return null;
    }

    return (
      <Host>
        <img
          src={logoUrl}
          alt={`${this.application!.name} logo`}
          class={this.componentClassName}
          width={this.width}
          height={this.height}
        />
      </Host>
    );
  }
}
