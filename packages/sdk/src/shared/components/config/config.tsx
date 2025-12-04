import * as Sentry from "@sentry/browser";
import {Component, Prop, h, Env} from "@stencil/core";
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
    if (Env.NODE_ENV !== "development") {
      console.log("Initializing Sentry...");
      this.initializeSentry();
    }

    if (!this.baseUrl || !this.apiKey) {
      console.error("baseUrl and apiKey are required");
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
      dsn: "https://d4cc4e5f6d985e61c56330dd27d104d6@o4507882295132160.ingest.de.sentry.io/4510443854037072",
      environment: process.env.NODE_ENV,
      sendDefaultPii: true,
      tracesSampleRate: 0.005,
    });
  };
}
