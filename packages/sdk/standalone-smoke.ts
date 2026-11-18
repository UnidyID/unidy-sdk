import type { StandaloneApiClient, StandaloneUnidyClient, StandaloneUnidyClientConfig } from "./dist/types/api/standalone";

async function run() {
  const mod = await import("./dist/collection/api/standalone.js");
  const { StandaloneApiClient, createStandaloneClient } = mod;

  const config: StandaloneUnidyClientConfig = {
    baseUrl: "https://example.com",
    apiKey: "test-api-key",
  };

  type _ApiClientHasBaseUrl = StandaloneApiClient extends { baseUrl: string } ? true : never;
  type _UnidyClientHasAuth = StandaloneUnidyClient extends { auth: unknown } ? true : never;
  type _UnidyClientHasBrandConnections = StandaloneUnidyClient extends { brandConnections: unknown } ? true : never;
  const _typeCheckBaseUrl: _ApiClientHasBaseUrl = true;
  const _typeCheckAuth: _UnidyClientHasAuth = true;
  const _typeCheckBrandConnections: _UnidyClientHasBrandConnections = true;

  const apiClient = new StandaloneApiClient(config);
  const client = createStandaloneClient(config);

  console.log("[standalone-smoke]", {
    hasBaseUrl: typeof apiClient.baseUrl === "string",
    hasAuthService: Boolean(client.auth),
    hasBrandConnectionsService: Boolean(client.brandConnections),
    typeCheckBaseUrl: _typeCheckBaseUrl,
    typeCheckAuth: _typeCheckAuth,
    typeCheckBrandConnections: _typeCheckBrandConnections,
  });
}

run().catch((error) => {
  console.error("[standalone-smoke] failed", error);
  process.exit(1);
});
