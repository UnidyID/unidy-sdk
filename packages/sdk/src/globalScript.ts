import { Build } from "@stencil/core";
import { createLogger } from "./logger";
import { initSentry } from "./shared/sentry";

const logger = createLogger("globalScript");

export default function () {
  // or export default async function()
  logger.info("Logger initialized. You can set the log level in the browser console, e.g., setLogLevel('debug').");
  if (!Build.isDev) {
    logger.info("Initializing Sentry...");
    initSentry();
  }
}
