import { Component, h, Prop } from "@stencil/core";
import { unidyState } from "../../../shared/store/unidy-store";
import { oauthState } from "../../store/oauth-store";

@Component({
  tag: "u-oauth-logo",
  shadow: false,
})
export class OAuthLogo {
  @Prop({ attribute: "class-name" }) componentClassName = "";
  @Prop() width = "64";
  @Prop() height = "64";

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
