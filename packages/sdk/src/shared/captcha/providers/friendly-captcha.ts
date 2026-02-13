import type { CaptchaExecuteResult } from "../types";
import { BaseWidgetCaptchaProvider } from "./base-provider";

declare global {
  interface Window {
    friendlyChallenge: {
      WidgetInstance: new (
        container: HTMLElement,
        options: {
          sitekey: string;
          doneCallback: (solution: string) => void;
          errorCallback?: (error: Error) => void;
        },
      ) => FriendlyCaptchaWidget;
    };
  }
}

interface FriendlyCaptchaWidget {
  reset: () => void;
  destroy: () => void;
  getResponse: () => string | undefined;
}

/**
 * Friendly Captcha provider implementation
 * This is a privacy-friendly, challenge-based captcha
 */
export class FriendlyCaptchaProvider extends BaseWidgetCaptchaProvider {
  readonly provider = "friendly_captcha" as const;
  protected readonly scriptUrl = "https://cdn.jsdelivr.net/npm/friendly-challenge@0.9.12/widget.module.min.js";
  protected readonly scriptIdentifier = "friendly-challenge";

  private widget: FriendlyCaptchaWidget | null = null;
  private lastToken: string | null = null;

  protected getScriptAttributes(): Partial<HTMLScriptElement> {
    return {
      async: true,
      type: "module",
    };
  }

  protected isGlobalAvailable(): boolean {
    return typeof window.friendlyChallenge !== "undefined";
  }

  protected onScriptLoaded(): Promise<void> {
    // Wait a tick for the module to initialize
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  async execute(_action?: string): Promise<CaptchaExecuteResult> {
    if (!this.loaded || !this.siteKey) {
      throw new Error("Friendly Captcha not loaded. Call load() first.");
    }

    // If we already have a token, return it
    if (this.lastToken) {
      return {
        token: this.lastToken,
        provider: this.provider,
      };
    }

    if (this.widget) {
      const existingToken = this.widget.getResponse();
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
      if (!this.widget) {
        reject(new Error("Friendly Captcha widget not rendered. Call render() first."));
      }
    });
  }

  render(container: HTMLElement): void {
    if (!this.loaded || !this.siteKey) {
      throw new Error("Friendly Captcha not loaded. Call load() first.");
    }

    // Destroy existing widget if present
    if (this.widget) {
      this.widget.destroy();
    }

    this.lastToken = null;

    this.widget = new window.friendlyChallenge.WidgetInstance(container, {
      sitekey: this.siteKey,
      doneCallback: (solution: string) => {
        this.lastToken = solution;
        this.onSuccess(solution);
      },
      errorCallback: (error: Error) => this.onError(error),
    });
  }

  reset(): void {
    super.reset();
    if (this.widget) {
      this.widget.reset();
    }
    this.lastToken = null;
  }

  destroy(): void {
    if (this.widget) {
      this.widget.destroy();
      this.widget = null;
    }
    this.lastToken = null;
    super.destroy();
  }
}
