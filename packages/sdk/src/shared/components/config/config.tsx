import * as Sentry from "@sentry/browser";
import { Component, Event, type EventEmitter, h, Prop, Watch } from "@stencil/core";
import { getUnidyClient } from "../../../api/";
import { Auth } from "../../../auth";
import i18n from "../../../i18n";
import { UnidyComponent } from "../../base/component";
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
  @Prop() mode: "production" | "development" = "production";
  @Prop() baseUrl = "";
  @Prop() apiKey = "";
  @Prop() customTranslations: string | Record<string, TranslationTree> = "";
  @Prop() fallbackLocale = "en";
  @Prop() locale = "en";
  @Prop() checkSignedIn = false;

  @Event() unidyInitialized!: EventEmitter<Config>;
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

    const auth = await Auth.initialize(getUnidyClient());

    if (this.checkSignedIn) {
      auth.helpers.checkSignedIn();
    }

    this.logger.debug("Unidy SDK initialized successfully");
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
