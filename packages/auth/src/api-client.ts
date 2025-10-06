import { UnidyClient } from "@unidy.io/sdk-api-client";
import { unidyState } from "./store/unidy-store";

let instance: UnidyClient | null = null;

function getUnidyClient(): UnidyClient {
  if (!instance) {
    if (!unidyState.baseUrl || !unidyState.apiKey) {
      throw new Error("UnidyClient configuration is incomplete. baseUrl and apiKey are required.");
    }

    instance = new UnidyClient(unidyState.baseUrl, unidyState.apiKey);
  }

  return instance;
}

function reset(): void {
  instance = null;
}

export { getUnidyClient, reset };
