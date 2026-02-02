import { Component, Element, h, Prop } from "@stencil/core";
import { UnidyComponent } from "../../../logger";
import { unidyState } from "../../../shared/store/unidy-store";
import { oauthState } from "../../store/oauth-store";
import { getOAuthProvider } from "../context";

@Component({
  tag: "u-oauth-logo",
  shadow: false,
})
export class OAuthLogo extends UnidyComponent() {
  @Element() el!: HTMLElement;

  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() width = "64";
  @Prop() height = "64";

  componentWillLoad() {
    if (!getOAuthProvider(this.el)) {
      this.logger.warn("Must be used inside a u-oauth-provider");
    }
  }

  private getLogoUrl(): string | null {
    const logoUrl = oauthState.application?.logo_url;
    if (!logoUrl) return null;

    if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
      return logoUrl;
    }

    const baseUrl = unidyState.baseUrl?.replace(/\/$/, "") ?? "";
    return `${baseUrl}${logoUrl}`;
  }

  render() {
    const logoUrl = this.getLogoUrl();
    if (!logoUrl) {
      return null;
    }

    return (
      <img
        src={logoUrl}
        alt={`${oauthState.application?.name ?? "Application"} logo`}
        class={this.componentClassName}
        width={this.width}
        height={this.height}
      />
    );
  }
}
