import { Build } from "@stencil/core";
import * as Sentry from "@sentry/browser";
import { createLogger } from "./logger";

const logger = createLogger("globalScript");

export default function() { // or export default async function()
  logger.info("Logger initialized. You can set the log level in the browser console, e.g., setLogLevel('debug').");
  if (!Build.isDev) {
    logger.info("Initializing Sentry...");
    Sentry.init({
      dsn: "https://d4cc4e5f6d985e61c56330dd27d104d6@o4507882295132160.ingest.de.sentry.io/4510443854037072",
      environment: process.env.NODE_ENV,
      sendDefaultPii: true,
      tracesSampleRate: 0.005,
    });
  }
}
