import type { CaptchaExecuteResult } from "../types";
import { BaseCaptchaProvider } from "./base-provider";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * reCAPTCHA v3 provider implementation
 * This is an invisible captcha that runs in the background and returns a score
 */
export class RecaptchaV3Provider extends BaseCaptchaProvider {
  readonly provider = "recaptcha_v3" as const;
  protected readonly scriptUrl = "https://www.google.com/recaptcha/api.js";
  protected readonly scriptIdentifier = "recaptcha";

  protected getScriptUrl(): string {
    return `${this.scriptUrl}?render=${this.siteKey}`;
  }

  protected isGlobalAvailable(): boolean {
    return typeof window.grecaptcha !== "undefined";
  }

  protected onScriptLoaded(): Promise<void> {
    return new Promise((resolve) => {
      window.grecaptcha.ready(resolve);
    });
  }

  async execute(action = "submit"): Promise<CaptchaExecuteResult> {
    if (!this.loaded || !this.siteKey) {
      throw new Error("reCAPTCHA v3 not loaded. Call load() first.");
    }

    const token = await window.grecaptcha.execute(this.siteKey, { action });

    return {
      token,
      provider: this.provider,
    };
  }

  render(_container: HTMLElement): void {
    // reCAPTCHA v3 is invisible, no rendering needed
  }

  reset(): void {
    // reCAPTCHA v3 doesn't need reset - each execute() generates a new token
  }
}
