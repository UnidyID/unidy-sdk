import * as Sentry from "@sentry/browser";
import { Component, Prop, Watch, Event, type EventEmitter, h } from "@stencil/core";
import i18n from "../../../i18n";
import { unidyState } from "../../store/unidy-store";
import {Auth, getUnidyClient} from "../../../auth";

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

@Component({
  tag: "u-config",
  shadow: false,
})
export class UnidyConfig {
  @Prop() mode: "production" | "development" = "production";
  @Prop() baseUrl = "";
  @Prop() apiKey = "";
  @Prop() customTranslations: string | Record<string, any> = "";
  @Prop() fallbackLocale = "en";
  @Prop() locale = "en";

  @Event() unidyInitialized!: EventEmitter<Config>;
  @Event() configChange!: EventEmitter<ConfigChange>;

  @Watch('locale')
  onLocaleChange(newValue: string) {
    i18n.changeLanguage(newValue);
    unidyState.locale = newValue;
  }

  componentWillLoad() {
    if (!this.baseUrl || !this.apiKey) {
      console.error("baseUrl and apiKey are required");
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
    i18n.changeLanguage(this.locale);
    unidyState.locale = this.locale;

    Auth.initialize(getUnidyClient());
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
        const translations =
          typeof this.customTranslations === "string"
            ? JSON.parse(this.customTranslations)
            : this.customTranslations;

        for (const lang in translations) {
          if (Object.prototype.hasOwnProperty.call(translations, lang)) {
            i18n.addResourceBundle(lang, "translation", translations[lang], true, true);
          }
        }
      } catch (error) {
        Sentry.captureException("Failed to parse customTranslations", error)
      }
    }
  }
}
