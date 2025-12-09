import { UnidyClient } from "../api";
import { unidyState } from "../shared/store/unidy-store";

let instance: UnidyClient | null = null;

function getUnidyClient(): UnidyClient {
  if (!unidyState.isConfigured) {
    throw new Error(
      "Config not initialized. Ensure <u-config> is loaded before making API calls by using waitForConfig() to wait for initialization.",
    );
  }

  if (!instance) {
    instance = new UnidyClient(unidyState.baseUrl, unidyState.apiKey);
  }

  return instance;
}

function reset(): void {
  instance = null;
}

export { getUnidyClient, reset };
