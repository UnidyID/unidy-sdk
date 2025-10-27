// google-login-button.tsx
import { Component, h, Prop } from "@stencil/core";
import { unidyState } from "../../../store/unidy-store";
import { GoogleLogo } from "./social-login-button-logos/GoogleLogo";
import { LinkedInLogo } from "./social-login-button-logos/LinkedInLogo";
import { AppleLogo } from "./social-login-button-logos/AppleLogo";
import { FacebookLogo } from "./social-login-button-logos/FacebookLogo";
import { VerimiLogo } from "./social-login-button-logos/VerimiLogo";
import { DiscordLogo } from "./social-login-button-logos/DiscordLogo";

@Component({
  tag: "unidy-social-login-button",
  shadow: true,
  styleUrl: "unidy-social-login-button.css",
})
export class UnidySocialLoginButton {
  @Prop() text = "Continue with Google";
  @Prop() socialLoginProvider: "google" | "linkedin" | "apple" | "facebook" | "verimi" | "discord" = "google";
  @Prop() socialLoginRedirectUri: string | null = null;

  private onClick = async () => {
    const baseUrl = unidyState.baseUrl;
    window.location.href = `${baseUrl}/users/auth/${this.socialLoginProvider === "google" ? "google_oauth2" : this.socialLoginProvider}?sdk_redirect_uri=${this.socialLoginRedirectUri ? encodeURIComponent(this.socialLoginRedirectUri) : baseUrl}`;
  };

  private renderIcon() {
    switch (this.socialLoginProvider) {
      case "google":
        return <GoogleLogo />;
      case "linkedin":
        return <LinkedInLogo />;
      case "apple":
        return <AppleLogo />;
      case "facebook":
        return <FacebookLogo />;
      case "verimi":
        return <VerimiLogo />;
      case "discord":
        return <DiscordLogo />;
      default:
        return null;
    }
  }
  render() {

    return (
      <button
        class="relative cursor-pointer grid grid-cols-6 content-center gap-3 w-full h-10 border border-solid border-gray-300 rounded-md bg-white text-[#1f1f1f] text-base font-medium hover:bg-gray-50 transition"
        style={{ width: "100%" }}
        onClick={this.onClick}
        part="social-login-button-width"
      >
        <div class="absolute col-start-1 ml-4 md:col-span-4 md:col-start-3 content-center flex items-center justify-center h-full">
          {this.renderIcon()}
          <span class="font-medium [font-family:'Roboto',Arial,sans-serif] ml-4">
            {this.text}
          </span>
          <span style={{ display: "none" }}>Sign in with {this.text}</span>
        </div>
      </button>
    );
  }
}
