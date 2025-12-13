import * as Sentry from "@sentry/browser";
import { Component, h, Prop } from "@stencil/core";
import { t } from "../../../i18n";
import { unidyState } from "../../../shared/store/unidy-store";
import { authState } from "../../store/auth-store";
import { GoogleLogo } from "./logos/google";
import { LinkedInLogo } from "./logos/linkedin";
import { AppleLogo } from "./logos/apple";
import { FacebookLogo } from "./logos/facebook";
import { DiscordLogo } from "./logos/discord";

const SHARED_ICON_CLASSNAME = "w-5 h-5 block";

const ICON_MAP = {
  google: <GoogleLogo className={SHARED_ICON_CLASSNAME} />,
  linkedin: <LinkedInLogo className={SHARED_ICON_CLASSNAME} />,
  apple: <AppleLogo className={`${SHARED_ICON_CLASSNAME} fill-current`} />,
  discord: <DiscordLogo className={`${SHARED_ICON_CLASSNAME} fill-current`} />,
  facebook: <FacebookLogo className="w-6 h-6 block" />,
} as const;

type SocialLoginProvider = keyof typeof ICON_MAP | "unidy";

@Component({
  tag: "u-social-login-button",
  styleUrl: "social-login-button.css",
  shadow: true,
})
export class SocialLoginButton {
  @Prop() provider: SocialLoginProvider = "google";
  @Prop() redirectUri: string = window.location.href;
  @Prop() iconOnly = false;
  @Prop() theme: "light" | "dark" = "light";

  componentWillLoad() {
    if (this.isUnsupportedProvider) {
      Sentry.captureException(`[u-social-login-button] Unsupported provider "${this.provider}".`);
      return;
    }
  }

  private get isUnsupportedProvider(): boolean {
    return !Object.prototype.hasOwnProperty.call(ICON_MAP, this.provider) && this.provider !== "unidy";
  }

  private get isProviderEnabled(): boolean {
    if (authState.step !== "verification") {
      return true; // TODO: for now we show all providers on the email step since we don't have registration flow in place yet
    }

    if (!authState.availableLoginOptions?.social_logins) {
      return false;
    }

    return authState.availableLoginOptions.social_logins.some((enabled) => enabled.startsWith(this.provider) || enabled === this.provider);
  }

  private getAuthUrl(): string {
    const baseUrl = unidyState.baseUrl;
    const redirectUri = this.redirectUri ? encodeURIComponent(this.redirectUri) : baseUrl;

    return `${baseUrl}/api/sdk/v1/sign_ins/auth/omniauth/${this.provider}?sdk_redirect_uri=${redirectUri}`;
  }

  private onClick = async () => {
    if (!unidyState.baseUrl) {
      console.error("[u-social-login-button] baseUrl is not set. Make sure <u-config> is rendered with a valid base-url.");
      return;
    }

    console.log("getAuthUrl", this.getAuthUrl());

    window.location.href = this.getAuthUrl();
  };

  private renderIcon() {
    if (this.isUnsupportedProvider || this.provider === "unidy") {
      return null;
    }

    return ICON_MAP[this.provider];
  }

  private getButtonClasses(): string {
    const baseClasses = "w-full h-10 border border-solid rounded-md text-base font-medium";
    const cursorClass = this.isUnsupportedProvider ? "cursor-not-allowed" : "cursor-pointer";
    const themeClasses =
      this.theme === "dark"
        ? "bg-[#131314] text-white border-gray-600 hover:bg-[#1f1f20]"
        : "bg-white text-[#1f1f1f] border-gray-300 hover:bg-gray-100";

    return `${baseClasses} ${cursorClass} ${themeClasses}`;
  }

  render() {
    if (!this.isProviderEnabled) {
      return null;
    }

    const providerName = this.provider.charAt(0).toUpperCase() + this.provider.slice(1);
    const text = t("auth.socialLogin.buttonText", {
      defaultValue: "Continue with {{provider}}",
      provider: providerName,
    });

    // TODO: allow users to customize already used providers with custom text and icon
    return (
      <button type="button" class={this.getButtonClasses()} onClick={this.onClick} part="social-login-button">
        <div class="flex items-center justify-center" part="social-login-button-content">
          <slot name="icon">
            <span aria-hidden="true">{this.renderIcon()}</span>
          </slot>

          {this.iconOnly ? (
            // Render the hidden text for accessibility.
            <span class="sr-only">{text}</span>
          ) : (
            <span class={!this.isUnsupportedProvider ? "ml-4" : ""} part="social-login-button-text">
              {text}
            </span>
          )}
        </div>
      </button>
    );
  }
}
