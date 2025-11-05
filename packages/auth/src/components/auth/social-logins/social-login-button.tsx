import { Component, h, Prop } from "@stencil/core";
import { unidyState } from "../../../store/unidy-store";
import { GoogleLogo } from "./logos/google";
import { LinkedInLogo } from "./logos/linkedin";
import { AppleLogo } from "./logos/apple";
import { FacebookLogo } from "./logos/facebook";
import { VerimiLogo } from "./logos/verimi";
import { DiscordLogo } from "./logos/discord";

const SHARED_ICON_CLASSNAME = "w-5 h-5 block";

const ICON_MAP = {
  google: <GoogleLogo className={SHARED_ICON_CLASSNAME} />,
  linkedin: <LinkedInLogo className={SHARED_ICON_CLASSNAME} />,
  apple: <AppleLogo className={`${SHARED_ICON_CLASSNAME} fill-current`} />,
  facebook: <FacebookLogo className={SHARED_ICON_CLASSNAME} />,
  verimi: <VerimiLogo className={SHARED_ICON_CLASSNAME} />,
  discord: <DiscordLogo className={`${SHARED_ICON_CLASSNAME} fill-current`} />,
} as const;

type SocialLoginProvider = keyof typeof ICON_MAP;

@Component({
  tag: "unidy-social-login-button",
  shadow: true,
  styleUrl: "social-login-button.css",
})
export class UnidySocialLoginButton {
  @Prop() text = "Continue with Google";
  @Prop() socialLoginProvider: SocialLoginProvider = "google";
  @Prop() socialLoginRedirectUri: string | null = null;
  @Prop() iconOnly = false;
  @Prop() theme: "light" | "dark" = "light";

  private get isUnsupportedProvider(): boolean {
    return !Object.prototype.hasOwnProperty.call(ICON_MAP, this.socialLoginProvider);
  }

  private getAuthUrl(): string {
    const baseUrl = unidyState.baseUrl;
    const authProvider = this.socialLoginProvider === "google" ? "google_oauth2" : this.socialLoginProvider;
    const redirectUri = this.socialLoginRedirectUri ? encodeURIComponent(this.socialLoginRedirectUri) : baseUrl;

    return `${baseUrl}/users/auth/${authProvider}?sdk_redirect_uri=${redirectUri}`;
  }

  private onClick = async () => {
    if (this.isUnsupportedProvider) {
      console.warn(`[unidy-social-login-button] Click prevented: unsupported provider "${this.socialLoginProvider}".`);
      return;
    }

    if (!unidyState.baseUrl) {
      console.error("[unidy-social-login-button] baseUrl is not set. Make sure <unidy-config> is rendered with a valid base-url.");
      return;
    }

    window.location.href = this.getAuthUrl();
  };

  private renderIcon() {
    if (this.isUnsupportedProvider) {
      console.error(`[unidy-social-login-button] Unsupported social login provider: ${this.socialLoginProvider}`);
      return null;
    }
    return ICON_MAP[this.socialLoginProvider];
  }

  private getButtonClasses(): string {
    const baseClasses =
      "relative grid grid-cols-6 content-center gap-3 w-full h-10 border border-solid rounded-md text-base font-medium transition";
    const cursorClass = this.isUnsupportedProvider ? "cursor-not-allowed" : "cursor-pointer";
    const themeClasses =
      this.theme === "dark"
        ? "button-background-dark text-white border-gray-600 hover:button-border-dark"
        : "bg-white text-[#1f1f1f] border-gray-300 hover:bg-gray-50";

    return `${baseClasses} ${cursorClass} ${themeClasses}`;
  }

  private getContentClasses(): string {
    return this.iconOnly
      ? "col-span-6 content-center flex items-center justify-center"
      : "absolute col-start-1 md:col-span-4 md:col-start-3 content-center flex items-center justify-center h-full";
  }

  render() {
    return (
      <button type="button" class={this.getButtonClasses()} onClick={this.onClick} part="social-login-button">
        <div class={this.getContentClasses()} part="social-login-button-content">
          {this.renderIcon()}
          {!this.iconOnly && (
            <span class={!this.isUnsupportedProvider ? "ml-4" : ""} part="social-login-button-text">
              {this.text}
            </span>
          )}
          {/* Hidden text for accessibility */}
          <span style={{ display: "none" }}>{this.text}</span>
        </div>
      </button>
    );
  }
}
