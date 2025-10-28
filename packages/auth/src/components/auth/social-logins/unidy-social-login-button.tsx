import { Component, h, Prop } from "@stencil/core";
import { unidyState } from "../../../store/unidy-store";
import { GoogleLogo } from "./social-login-button-logos/GoogleLogo";
import { LinkedInLogo } from "./social-login-button-logos/LinkedInLogo";
import { AppleLogo } from "./social-login-button-logos/AppleLogo";
import { FacebookLogo } from "./social-login-button-logos/FacebookLogo";
import { VerimiLogo } from "./social-login-button-logos/VerimiLogo";
import { DiscordLogo } from "./social-login-button-logos/DiscordLogo";

const IconMap = {
  google: <GoogleLogo />,
  linkedin: <LinkedInLogo />,
  apple: <AppleLogo />,
  facebook: <FacebookLogo />,
  verimi: <VerimiLogo />,
  discord: <DiscordLogo />,
};

type SocialLoginProvider = keyof typeof IconMap;

@Component({
  tag: "unidy-social-login-button",
  shadow: true,
  styleUrl: "unidy-social-login-button.css",
})
export class UnidySocialLoginButton {
  @Prop() text = "Continue with Google";
  @Prop() socialLoginProvider: SocialLoginProvider = "google";
  @Prop() socialLoginRedirectUri: string | null = null;
  @Prop() iconOnly = false;
  @Prop() theme: "light" | "dark" = "light";

  private get isUnsupportedProvider() {
    return !Object.prototype.hasOwnProperty.call(IconMap, this.socialLoginProvider);
  }


  private onClick = async () => {
    if (this.isUnsupportedProvider) {
      console.warn(`[unidy-social-login-button] Click prevented: unsupported provider "${this.socialLoginProvider}".`);
      return;
    }
    const baseUrl = unidyState.baseUrl;
    window.location.href = `${baseUrl}/users/auth/${this.socialLoginProvider === "google" ? "google_oauth2" : this.socialLoginProvider}?sdk_redirect_uri=${this.socialLoginRedirectUri ? encodeURIComponent(this.socialLoginRedirectUri) : baseUrl}`;
  };

  private renderIcon() {
    if (this.isUnsupportedProvider) {
      console.error(`[unidy-social-login-button] Unsupported social login provider: ${this.socialLoginProvider}`);
      return null;
    }
    return IconMap[this.socialLoginProvider];
  }

  render() {
    const buttonBaseClasses = "relative grid grid-cols-6 content-center gap-3 w-full h-10 border border-solid rounded-md text-base font-medium transition";
    const cursorClass = this.isUnsupportedProvider ? "cursor-not-allowed" : "cursor-pointer";
    const lightModeClasses = "bg-white text-[#1f1f1f] border-gray-300 hover:bg-gray-50";
    const darkModeClasses = "button-background-dark text-white border-gray-600 hover:button-border-dark";
    const themeClasses = this.theme === "dark" ? darkModeClasses : lightModeClasses;
    const buttonIconOnlyClasses = "relative grid grid-cols-6 content-center gap-3 w-full h-10 border border-solid rounded-md text-base font-medium transition";
    const buttonClasses = `${this.iconOnly ? buttonIconOnlyClasses : buttonBaseClasses} ${cursorClass} ${themeClasses}`;
    const buttonContentClasses = this.iconOnly ? "col-span-6 content-center flex items-center justify-center" : "absolute col-start-1 ml-4 md:col-span-4 md:col-start-3 content-center flex items-center justify-center h-full";


    return (
      <button
        type="button"
        class={`${buttonClasses}`}
        style={{ width: "100%" }}
        onClick={this.onClick}
        part="social-login-button-width"
      >
        <div class={`${buttonContentClasses}`}>
          {this.renderIcon()}
          {!this.iconOnly && <span class="font-medium [font-family:'Roboto',Arial,sans-serif] ml-4">{this.text}</span>}
          <span style={{ display: "none" }}>{this.text}</span>
        </div>
      </button>
    );
  }
}
