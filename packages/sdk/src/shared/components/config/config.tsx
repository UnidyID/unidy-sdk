import * as Sentry from "@sentry/browser";
import { Component, Event, type EventEmitter, h, Prop, Watch } from "@stencil/core";
import { getUnidyClient } from "../../../api/";
import { Auth } from "../../../auth";
import i18n from "../../../i18n";
import { UnidyComponent } from "../../base/component";
import { captchaManager } from "../../captcha";
import { unidyState } from "../../store/unidy-store";

let configInstance: UnidyConfig | null = null;

export interface Config {
  apiKey: string;
  baseUrl: string;
  locale: string;
  mode: "production" | "development";
}

export interface ConfigChange {
  key: string;
  value: string;
  previousValue: string;
}

type TranslationTree = {
  [key: string]: string | TranslationTree;
};

@Component({
  tag: "u-config",
  shadow: false,
})
export class UnidyConfig extends UnidyComponent() {
  /** SDK mode: 'production' or 'development'. Development mode enables verbose logging. */
  @Prop() mode: "production" | "development" = "production";
  /** The Unidy API base URL (e.g., 'https://your-tenant.unidy.io'). */
  @Prop() baseUrl = "";
  /** Your Unidy API key. */
  @Prop() apiKey = "";
  /** Custom translations as JSON string or object. Keyed by locale code. */
  @Prop() customTranslations: string | Record<string, TranslationTree> = "";
  /** Fallback locale when translation is missing. */
  @Prop() fallbackLocale = "en";
  /** Current locale for translations (e.g., 'en', 'de', 'fr'). */
  @Prop() locale = "en";
  /** If true, checks for existing session on load and restores authentication state. */
  @Prop() checkSignedIn = false;

  /** Fired when SDK initialization is complete. Contains configuration details. */
  @Event() unidyInitialized!: EventEmitter<Config>;
  /** Fired when a configuration property changes. */
  @Event() configChange!: EventEmitter<ConfigChange>;

  async componentWillLoad() {
    if (configInstance !== null) {
      this.logger.error("Only one <u-config> element is allowed per page.");
      return;
    }
    configInstance = this;

    if (!this.baseUrl || !this.apiKey) {
      this.logger.error("baseUrl and apiKey are required");
      return;
    }

    unidyState.apiKey = this.apiKey;
    unidyState.baseUrl = this.baseUrl;
    unidyState.locale = this.locale;
    unidyState.isConfigured = true;

    this.unidyInitialized.emit({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      locale: this.locale,
      mode: this.mode,
    });

    i18n.options.fallbackLng = this.fallbackLocale;

    this.loadCustomTranslations();
    unidyState.locale = this.locale;

    const client = getUnidyClient();
    const auth = await Auth.initialize(client);

    // Fetch captcha configuration (non-blocking, but captchaManager.execute() will
    // await this promise before checking feature flags to avoid race conditions)
    const captchaConfigPromise = this.loadCaptchaConfig(client);
    captchaManager.setConfigLoadingPromise(captchaConfigPromise);

    if (this.checkSignedIn) {
      auth.helpers.checkSignedIn();
    }

    this.logger.debug("Unidy SDK initialized successfully");
  }

  private async loadCaptchaConfig(client: ReturnType<typeof getUnidyClient>) {
    try {
      const [error, data] = await client.captcha.getCaptchaConfig();

      if (error === "not_found") {
        this.logger.debug("No captcha configuration found for this client");
        return;
      }

      if (error !== null || !data || !("provider" in data)) {
        this.logger.warn("Failed to fetch captcha config:", error);
        return;
      }

      unidyState.captchaConfig = data;
      this.logger.debug("Captcha config loaded:", data.provider);

      // Pre-initialize the captcha provider for faster execution
      await captchaManager.initialize();
    } catch (err) {
      this.logger.warn("Error loading captcha config:", err);
    }
  }

  disconnectedCallback() {
    if (configInstance === this) {
      configInstance = null;
      unidyState.isConfigured = false;
    }
  }

  // extend the list of properties that should be watched when new properties are added to the Config
  @Watch("mode")
  @Watch("locale")
  onPropChange(newValue: string, oldValue: string, propName: keyof Config) {
    if (oldValue === undefined) return;

    if (propName in unidyState) {
      (unidyState as Record<keyof Config, string>)[propName] = newValue;
    }

    this.configChange.emit({
      key: propName,
      value: newValue,
      previousValue: oldValue,
    });
  }

  render() {
    return <slot />;
  }

  private loadCustomTranslations() {
    if (this.customTranslations) {
      try {
        const translations = typeof this.customTranslations === "string" ? JSON.parse(this.customTranslations) : this.customTranslations;

        for (const lang in translations) {
          if (Object.hasOwn(translations, lang)) {
            i18n.addResourceBundle(lang, "translation", translations[lang], true, true);
          }
        }
      } catch (error) {
        Sentry.captureException("Failed to parse customTranslations", error);
      }
    }
  }
}
