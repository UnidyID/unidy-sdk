import type { CaptchaExecuteResult } from "../types";
import { BaseWidgetCaptchaProvider } from "./base-provider";

declare global {
  interface Window {
    hcaptcha: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (error: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact" | "invisible";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}

/**
 * hCaptcha provider implementation
 * This is a challenge-based captcha that shows a widget
 */
export class HCaptchaProvider extends BaseWidgetCaptchaProvider {
  readonly provider = "hcaptcha" as const;
  protected readonly scriptUrl = "https://js.hcaptcha.com/1/api.js";
  protected readonly scriptIdentifier = "hcaptcha";

  private widgetId: string | null = null;

  protected getScriptUrl(): string {
    return `${this.scriptUrl}?render=explicit`;
  }

  protected isGlobalAvailable(): boolean {
    return typeof window.hcaptcha !== "undefined";
  }

  protected onScriptLoaded(): void {
    // hCaptcha is ready immediately after script load
  }

  async execute(_action?: string): Promise<CaptchaExecuteResult> {
    if (!this.loaded || !this.siteKey) {
      throw new Error("hCaptcha not loaded. Call load() first.");
    }

    // If we already have a token from the widget, return it
    if (this.widgetId) {
      const existingToken = window.hcaptcha.getResponse(this.widgetId);
      if (existingToken) {
        return {
          token: existingToken,
          provider: this.provider,
        };
      }
    }

    // Wait for the widget callback
    return new Promise((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      // If no widget rendered yet, reject
      if (!this.widgetId) {
        reject(new Error("hCaptcha widget not rendered. Call render() first."));
      }
    });
  }

  render(container: HTMLElement): void {
    if (!this.loaded || !this.siteKey) {
      throw new Error("hCaptcha not loaded. Call load() first.");
    }

    // Remove existing widget if present
    if (this.widgetId) {
      window.hcaptcha.remove(this.widgetId);
    }

    this.widgetId = window.hcaptcha.render(container, {
      sitekey: this.siteKey,
      callback: (token: string) => this.onSuccess(token),
      "error-callback": (error: string) => this.onError(error),
      "expired-callback": () => this.reset(),
      theme: "light",
      size: "normal",
    });
  }

  reset(): void {
    super.reset();
    if (this.widgetId) {
      window.hcaptcha.reset(this.widgetId);
    }
  }

  destroy(): void {
    if (this.widgetId) {
      window.hcaptcha.remove(this.widgetId);
      this.widgetId = null;
    }
    super.destroy();
  }
}
