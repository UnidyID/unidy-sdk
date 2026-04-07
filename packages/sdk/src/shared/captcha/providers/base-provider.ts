import type { CaptchaProvider } from "../api";
import type { CaptchaExecuteResult, CaptchaProviderInterface } from "../types";

/**
 * Base class for captcha providers that handles common functionality
 * like script loading and state management
 */
export abstract class BaseCaptchaProvider implements CaptchaProviderInterface {
  abstract readonly provider: CaptchaProvider;
  protected abstract readonly scriptUrl: string;
  protected abstract readonly scriptIdentifier: string;

  protected siteKey: string | null = null;
  protected loaded = false;
  protected loadPromise: Promise<void> | null = null;

  /**
   * Called after the script is loaded to perform provider-specific initialization
   */
  protected abstract onScriptLoaded(): void | Promise<void>;

  /**
   * Check if the provider's global object is available
   */
  protected abstract isGlobalAvailable(): boolean;

  /**
   * Build the full script URL with any query parameters
   */
  protected getScriptUrl(): string {
    return this.scriptUrl;
  }

  /**
   * Get script element attributes (async, defer, type, etc.)
   */
  protected getScriptAttributes(): Partial<HTMLScriptElement> {
    return {
      async: true,
      defer: true,
    };
  }

  async load(siteKey: string): Promise<void> {
    if (this.loaded && this.siteKey === siteKey) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.siteKey = siteKey;

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector(`script[src*="${this.scriptIdentifier}"]`)) {
        if (this.isGlobalAvailable()) {
          Promise.resolve(this.onScriptLoaded()).then(() => {
            this.loaded = true;
            resolve();
          });
        } else {
          this.loadPromise = null;
          reject(new Error(`${this.provider} script found in DOM but global not available`));
        }
        return;
      }

      const script = document.createElement("script");
      script.src = this.getScriptUrl();

      // Apply script attributes
      const attributes = this.getScriptAttributes();
      if (attributes.async !== undefined) script.async = attributes.async;
      if (attributes.defer !== undefined) script.defer = attributes.defer;
      if (attributes.type) script.type = attributes.type;

      script.onload = () => {
        Promise.resolve(this.onScriptLoaded()).then(() => {
          this.loaded = true;
          resolve();
        });
      };

      script.onerror = () => {
        this.loadPromise = null;
        reject(new Error(`Failed to load ${this.provider} script`));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  abstract execute(action?: string): Promise<CaptchaExecuteResult>;

  abstract render(container: HTMLElement): void;

  abstract reset(): void;

  isLoaded(): boolean {
    return this.loaded;
  }

  destroy(): void {
    this.loaded = false;
    this.loadPromise = null;
    this.siteKey = null;
  }
}

/**
 * Base class for challenge-based captcha providers (Turnstile, hCaptcha, Friendly Captcha)
 * that require a visible widget
 */
export abstract class BaseWidgetCaptchaProvider extends BaseCaptchaProvider {
  protected pendingResolve: ((result: CaptchaExecuteResult) => void) | null = null;
  protected pendingReject: ((error: Error) => void) | null = null;

  /**
   * Called when the captcha is successfully completed
   */
  protected onSuccess(token: string): void {
    if (this.pendingResolve) {
      this.pendingResolve({
        token,
        provider: this.provider,
      });
      this.clearPending();
    }
  }

  /**
   * Called when the captcha encounters an error
   */
  protected onError(error: string | Error): void {
    if (this.pendingReject) {
      this.pendingReject(error instanceof Error ? error : new Error(`${this.provider} error: ${error}`));
      this.clearPending();
    }
  }

  protected clearPending(): void {
    this.pendingResolve = null;
    this.pendingReject = null;
  }

  reset(): void {
    this.clearPending();
  }

  destroy(): void {
    super.destroy();
    this.clearPending();
  }
}
