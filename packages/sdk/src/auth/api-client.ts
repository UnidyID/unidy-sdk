import * as Sentry from "@sentry/node";
import { UnidyClient } from "../api";
import { unidyState } from "../shared/store/unidy-store";

let instance: UnidyClient | null = null;

function getUnidyClient(): UnidyClient {
  if (!instance) {
    if (!unidyState.baseUrl || !unidyState.apiKey) {
      Sentry.logger.error("UnidyClient configuration is incomplete. baseUrl and apiKey are required.");
    }

    instance = new UnidyClient(unidyState.baseUrl, unidyState.apiKey);
  }

  return instance;
}

function reset(): void {
  instance = null;
}

export { getUnidyClient, reset };
