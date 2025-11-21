import * as Sentry from "@sentry/node";
import { Component, Prop, h } from "@stencil/core";
import { unidyState } from "../../store/unidy-store";
import { Auth, getUnidyClient } from "../../../auth";

@Component({
  tag: "u-config",
  shadow: false,
})
export class UnidyConfig {
  @Prop() baseUrl = "";
  @Prop() apiKey = "";

  componentWillLoad() {
    this.initializeSentry();

    if (!this.baseUrl || !this.apiKey) {
      Sentry.logger.error("baseUrl and apiKey are required");
      return;
    }

    unidyState.apiKey = this.apiKey;
    unidyState.baseUrl = this.baseUrl;

    Auth.initialize(getUnidyClient());
  }

  render() {
    return <slot />;
  }

  private initializeSentry = () => {
    Sentry.init({
      dsn: "https://057cb9294eb543f15a73220ed572fe8c@o4507882295132160.ingest.de.sentry.io/4507882297229392",
      environment: process.env.NODE_ENV,
      integrations: [
        Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
      ],
      sendDefaultPii: true,
      tracesSampleRate: 0.005,
    });
  };
}
