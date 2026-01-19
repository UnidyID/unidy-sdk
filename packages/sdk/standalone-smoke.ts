import type {
  StandaloneApiClient,
  StandaloneUnidyClient,
  StandaloneUnidyClientConfig,
} from "./dist/types/api/standalone";

async function run() {
  const mod = await import("./dist/collection/api/standalone.js");
  const { StandaloneApiClient, createStandaloneClient } = mod;

  const config: StandaloneUnidyClientConfig = {
    baseUrl: "https://example.com",
    apiKey: "test-api-key",
  };

  type _ApiClientHasBaseUrl = StandaloneApiClient extends { baseUrl: string } ? true : never;
  type _UnidyClientHasAuth = StandaloneUnidyClient extends { auth: unknown } ? true : never;
  const _typeCheckBaseUrl: _ApiClientHasBaseUrl = true;
  const _typeCheckAuth: _UnidyClientHasAuth = true;

  const apiClient = new StandaloneApiClient(config);
  const client = createStandaloneClient(config);

  console.log("[standalone-smoke]", {
    hasBaseUrl: typeof apiClient.baseUrl === "string",
    hasAuthService: Boolean(client.auth),
    typeCheckBaseUrl: _typeCheckBaseUrl,
    typeCheckAuth: _typeCheckAuth,
  });
}

run().catch((error) => {
  console.error("[standalone-smoke] failed", error);
  process.exit(1);
});
