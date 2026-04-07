import { createLogger } from "../../logger";
import { unidyState } from "../store/unidy-store";
import type { CaptchaConfig, CaptchaFeature, CaptchaProvider } from "./api";
import { FriendlyCaptchaProvider, HCaptchaProvider, RecaptchaV3Provider, TurnstileProvider } from "./providers";
import type { CaptchaExecuteResult, CaptchaProviderInterface } from "./types";

const logger = createLogger("CaptchaManager");

/**
 * Factory to create the appropriate captcha provider
 * The provider classes are lightweight - actual script loading happens lazily when load() is called
 */
function createProvider(providerType: CaptchaProvider): CaptchaProviderInterface {
  switch (providerType) {
    case "recaptcha_v3":
      return new RecaptchaV3Provider();
    case "turnstile":
      return new TurnstileProvider();
    case "hcaptcha":
      return new HCaptchaProvider();
    case "friendly_captcha":
      return new FriendlyCaptchaProvider();
    default:
      throw new Error(`Unknown captcha provider: ${providerType}`);
  }
}

/**
 * Singleton captcha manager that handles loading and executing captcha providers
 */
class CaptchaManager {
  private provider: CaptchaProviderInterface | null = null;
  private initPromise: Promise<void> | null = null;
  private configLoadingPromise: Promise<void> = Promise.resolve();

  /**
   * Get the current captcha configuration from the store
   */
  private get config(): CaptchaConfig | null {
    return unidyState.captchaConfig;
  }

  /**
   * Set the promise that resolves when captcha config loading is complete.
   * Called by the config component to signal that config fetching is in progress.
   * This ensures execute() waits for config before checking feature flags.
   */
  setConfigLoadingPromise(promise: Promise<void>): void {
    this.configLoadingPromise = promise;
  }

  /**
   * Check if captcha is enabled for a specific feature
   */
  isEnabledForFeature(feature: CaptchaFeature): boolean {
    if (!this.config) return false;

    switch (feature) {
      case "login":
        return this.config.login_enabled;
      case "registration":
        return this.config.registration_enabled;
      case "newsletter":
        return this.config.newsletter_enabled;
      default:
        return false;
    }
  }

  /**
   * Check if captcha is configured (has a config from backend)
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Check if the current provider requires a visible widget
   */
  requiresWidget(): boolean {
    if (!this.config) return false;
    // reCAPTCHA v3 is invisible, all others require a widget
    return this.config.provider !== "recaptcha_v3";
  }

  /**
   * Get the current provider type
   */
  getProviderType(): CaptchaProvider | null {
    return this.config?.provider ?? null;
  }

  /**
   * Initialize the captcha provider based on the config
   * Provider classes are lightweight - the external scripts are loaded lazily
   */
  async initialize(): Promise<void> {
    if (!this.config) {
      logger.debug("No captcha config found, skipping initialization");
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    const config = this.config;
    this.initPromise = (async () => {
      try {
        this.provider = createProvider(config.provider);
        await this.provider.load(config.site_key);
        logger.debug(`Captcha provider ${config.provider} loaded successfully`);
      } catch (error) {
        logger.error("Failed to initialize captcha provider:", error);
        this.provider = null;
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Render the captcha widget in a container (for challenge-based providers)
   */
  render(container: HTMLElement): void {
    if (!this.provider) {
      logger.warn("Cannot render captcha: provider not initialized");
      return;
    }

    if (!this.requiresWidget()) {
      logger.debug("Provider does not require widget rendering");
      return;
    }

    this.provider.render(container);
  }

  /**
   * Execute captcha and get a token
   * @param feature The feature being protected (used as action for reCAPTCHA v3)
   */
  async execute(feature: CaptchaFeature): Promise<CaptchaExecuteResult | null> {
    // Wait for config loading to complete before checking feature flags
    await this.configLoadingPromise;

    if (!this.isEnabledForFeature(feature)) {
      logger.debug(`Captcha not enabled for feature: ${feature}`);
      return null;
    }

    if (!this.provider) {
      // Try to initialize if not already done
      await this.initialize();
    }

    if (!this.provider) {
      throw new Error("Cannot execute captcha: provider not initialized");
    }

    try {
      const result = await this.provider.execute(feature);
      logger.debug(`Captcha token obtained for feature: ${feature}`);
      return result;
    } catch (error) {
      logger.error("Failed to execute captcha:", error);
      throw error;
    }
  }

  /**
   * Reset the captcha widget
   */
  reset(): void {
    this.provider?.reset();
  }

  /**
   * Check if the provider is ready
   */
  isReady(): boolean {
    return this.provider?.isLoaded() ?? false;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.provider?.destroy();
    this.provider = null;
    this.initPromise = null;
  }
}

// Export singleton instance
export const captchaManager = new CaptchaManager();
