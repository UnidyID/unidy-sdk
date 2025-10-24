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
  shadow: false
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
        class="relative box-border flex h-10 w-full min-w-min cursor-pointer items-center justify-center overflow-hidden rounded border border-[#747775] bg-white px-3 text-[14px] text-[#1f1f1f] outline-none transition-[background-color,border-color,box-shadow] duration-[218ms] ease-linear [letter-spacing:0.25px] [font-family:'Roboto',Arial,sans-serif] disabled:cursor-default disabled:border-[#1f1f1f1f] disabled:bg-[#ffffff61] hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.30),0_1px_3px_1px_rgba(60,64,67,0.15)]"
        style={{ width: "100%" }}
        onClick={this.onClick}
        part="social-login-button-width"
      >
        <div class="relative flex h-full w-full flex-row items-center justify-center">
          <div class="absolute left-3 flex items-center justify-center h-5 w-5">
            {this.renderIcon()}
          </div>
          <span class="font-medium [font-family:'Roboto',Arial,sans-serif] pl-8">
            {this.text}
          </span>
          <span style={{ display: "none" }}>Sign in with {this.text}</span>
        </div>
      </button>
    );
  }
}
