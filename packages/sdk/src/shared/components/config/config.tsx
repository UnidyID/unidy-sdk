import * as Sentry from "@sentry/browser";
import { Component, Prop, Watch, Event, type EventEmitter, h } from "@stencil/core";
import { unidyState } from "../../store/unidy-store";
import { Auth, getUnidyClient } from "../../../auth";

export interface Config {
  apiKey: string;
  baseUrl: string;
  language: string;
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
  @Prop() baseUrl = "";
  @Prop() apiKey = "";
  @Prop() language?: string;

  @Event() unidyInitialized!: EventEmitter<Config>;
  @Event() configChange!: EventEmitter<ConfigChange>;

  componentWillLoad() {
    this.initializeSentry();

    if (!this.baseUrl || !this.apiKey) {
      console.error("baseUrl and apiKey are required");
      return;
    }

    const resolvedLanguage = this.language || navigator.language || "en";

    unidyState.apiKey = this.apiKey;
    unidyState.baseUrl = this.baseUrl;
    unidyState.language = resolvedLanguage;

    unidyState.isConfigured = true;

    Auth.initialize(getUnidyClient());

    this.unidyInitialized.emit({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      language: resolvedLanguage,
    });
  }

  @Watch("baseUrl")
  onBaseUrlChange(newValue: string, oldValue: string) {
    if (oldValue === "") return;
    unidyState.baseUrl = newValue;
    this.configChange.emit({ key: "baseUrl", value: newValue, previousValue: oldValue });
  }

  @Watch("apiKey")
  onApiKeyChange(newValue: string, oldValue: string) {
    if (oldValue === "") return;
    unidyState.apiKey = newValue;
    this.configChange.emit({ key: "apiKey", value: newValue, previousValue: oldValue });
  }

  @Watch("language")
  onLanguageChange(newValue: string, oldValue: string) {
    if (oldValue === undefined) return;
    const resolvedLanguage = newValue || navigator.language || "en";
    unidyState.language = resolvedLanguage;
    this.configChange.emit({ key: "language", value: resolvedLanguage, previousValue: oldValue || "" });
  }

  render() {
    return <slot />;
  }

  private initializeSentry = () => {
    Sentry.init({
      dsn: "https://d4cc4e5f6d985e61c56330dd27d104d6@o4507882295132160.ingest.de.sentry.io/4510443854037072",
      environment: process.env.NODE_ENV,
      sendDefaultPii: true,
      tracesSampleRate: 0.005,
    });
  };
}
