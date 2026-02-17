import type { CaptchaFeature, CaptchaProvider } from "./api";

/**
 * Result of a captcha execution
 */
export interface CaptchaExecuteResult {
  token: string;
  provider: CaptchaProvider;
}

/**
 * Interface for captcha provider implementations
 */
export interface CaptchaProviderInterface {
  /** Provider identifier */
  readonly provider: CaptchaProvider;

  /** Load the provider's script */
  load(siteKey: string): Promise<void>;

  /** Execute captcha and get a token */
  execute(action?: string): Promise<CaptchaExecuteResult>;

  /** Render a visible captcha widget (for challenge-based providers) */
  render(container: HTMLElement): void;

  /** Reset the captcha widget */
  reset(): void;

  /** Check if the provider is loaded */
  isLoaded(): boolean;

  /** Cleanup resources */
  destroy(): void;
}

/**
 * Options for captcha execution
 */
export interface CaptchaExecuteOptions {
  /** The feature/action being protected (login, registration, newsletter) */
  feature: CaptchaFeature;
  /** Container element for challenge-based captchas */
  container?: HTMLElement;
}
