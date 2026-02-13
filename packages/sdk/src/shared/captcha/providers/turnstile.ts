import type { CaptchaExecuteResult } from "../types";
import { BaseWidgetCaptchaProvider } from "./base-provider";

declare global {
  interface Window {
    turnstile: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (error: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

/**
 * Cloudflare Turnstile provider implementation
 * This is a challenge-based captcha that may show a widget
 */
export class TurnstileProvider extends BaseWidgetCaptchaProvider {
  readonly provider = "turnstile" as const;
  protected readonly scriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  protected readonly scriptIdentifier = "turnstile";

  private widgetId: string | null = null;

  protected getScriptUrl(): string {
    return `${this.scriptUrl}?render=explicit`;
  }

  protected isGlobalAvailable(): boolean {
    return typeof window.turnstile !== "undefined";
  }

  protected onScriptLoaded(): void {
    // Turnstile is ready immediately after script load
  }

  async execute(_action?: string): Promise<CaptchaExecuteResult> {
    if (!this.loaded || !this.siteKey) {
      throw new Error("Turnstile not loaded. Call load() first.");
    }

    // If we already have a token from the widget, return it
    if (this.widgetId) {
      const existingToken = window.turnstile.getResponse(this.widgetId);
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
        reject(new Error("Turnstile widget not rendered. Call render() first."));
      }
    });
  }

  render(container: HTMLElement): void {
    if (!this.loaded || !this.siteKey) {
      throw new Error("Turnstile not loaded. Call load() first.");
    }

    // Remove existing widget if present
    if (this.widgetId) {
      window.turnstile.remove(this.widgetId);
    }

    this.widgetId = window.turnstile.render(container, {
      sitekey: this.siteKey,
      callback: (token: string) => this.onSuccess(token),
      "error-callback": (error: string) => this.onError(error),
      "expired-callback": () => this.reset(),
      theme: "auto",
      size: "normal",
    });
  }

  reset(): void {
    super.reset();
    if (this.widgetId) {
      window.turnstile.reset(this.widgetId);
    }
  }

  destroy(): void {
    if (this.widgetId) {
      window.turnstile.remove(this.widgetId);
      this.widgetId = null;
    }
    super.destroy();
  }
}
