import { Build } from "@stencil/core";
import * as Sentry from "@sentry/browser";

export default function() { // or export default async function()
  if (!Build.isDev) {
    console.log("Initializing Sentry...");
    Sentry.init({
      dsn: "https://d4cc4e5f6d985e61c56330dd27d104d6@o4507882295132160.ingest.de.sentry.io/4510443854037072",
      environment: process.env.NODE_ENV,
      sendDefaultPii: true,
      tracesSampleRate: 0.005,
    });
  }
}