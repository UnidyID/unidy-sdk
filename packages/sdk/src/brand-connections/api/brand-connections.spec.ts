import type { ApiResponse } from "../../api/base-client";
import type { ApiClientInterface } from "../../api/base-service";
import { BrandConnectionsService } from "./brand-connections";

const brandConnection = {
  id: 42,
  name: "other-brand",
  host: "other.example.com",
  url: "https://other.example.com",
  display_name: "Other Brand",
  logo_url: null,
  colors: {
    background: "#ffffff",
    foreground: "#000000",
    text: "#111111",
  },
  current: false,
  default: false,
  connected: false,
  connectable: true,
  disconnectable: false,
};

function apiResponse<T>(overrides: Partial<ApiResponse<T>>): ApiResponse<T> {
  return {
    data: undefined,
    success: true,
    status: 200,
    headers: new Headers(),
    ...overrides,
  };
}

describe("BrandConnectionsService", () => {
  const get = jest.fn();
  const post = jest.fn();
  const patch = jest.fn();
  const deleteRequest = jest.fn();
  const captureException = jest.fn();
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
  const client: ApiClientInterface = {
    baseUrl: "https://example.com",
    api_key: "api-key",
    get,
    post,
    patch,
    delete: deleteRequest,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function service(getIdToken: () => Promise<string | null> = async () => "id-token") {
    return new BrandConnectionsService(client, { getIdToken, logger, errorReporter: { captureException } });
  }

  it("lists validated brand connection state with the ID token", async () => {
    get.mockResolvedValue(apiResponse({ data: [brandConnection] }));

    await expect(service().list()).resolves.toEqual([null, [brandConnection]]);
    expect(get).toHaveBeenCalledWith("/api/sdk/v1/brand_connections", { "X-ID-Token": "id-token" });
  });

  it("connects a brand and validates the returned representation", async () => {
    const connectedBrand = { ...brandConnection, connected: true, connectable: false, disconnectable: true };
    post.mockResolvedValue(apiResponse({ data: connectedBrand, status: 201 }));

    await expect(service().connect({ brandId: 42 })).resolves.toEqual([null, connectedBrand]);
    expect(post).toHaveBeenCalledWith("/api/sdk/v1/brand_connections", { brand_id: 42 }, { "X-ID-Token": "id-token" });
  });

  it("disconnects a brand by ID", async () => {
    deleteRequest.mockResolvedValue(apiResponse({ data: undefined, status: 204 }));

    await expect(service().disconnect({ brandId: 42 })).resolves.toEqual([null, null]);
    expect(deleteRequest).toHaveBeenCalledWith("/api/sdk/v1/brand_connections/42", { "X-ID-Token": "id-token" });
  });

  it("returns the backend domain error identifier and details", async () => {
    post.mockResolvedValue(
      apiResponse({
        data: { error_identifier: "brand_already_connected" },
        success: false,
        status: 409,
      }),
    );

    await expect(service().connect({ brandId: 42 })).resolves.toEqual([
      "brand_already_connected",
      { error_identifier: "brand_already_connected" },
    ]);
  });

  it("preserves unknown API errors without claiming a known identifier", async () => {
    get.mockResolvedValue(
      apiResponse({
        data: { error_identifier: "future_error", meta: { retry: true } },
        success: false,
        status: 422,
      }),
    );

    await expect(service().list()).resolves.toEqual(["api_error", { error_identifier: "future_error", meta: { retry: true } }]);
  });

  it("returns missing_id_token when token resolution fails", async () => {
    await expect(
      service(async () => {
        throw new Error("token unavailable");
      }).list(),
    ).resolves.toEqual(["missing_id_token", null]);
    expect(get).not.toHaveBeenCalled();
  });

  it("reports an invalid success response", async () => {
    get.mockResolvedValue(apiResponse({ data: [{ id: "not-a-number" }] }));

    await expect(service().list()).resolves.toEqual(["invalid_response", null]);
    expect(captureException).toHaveBeenCalledWith(expect.anything(), { endpoint: "/api/sdk/v1/brand_connections" });
  });
});
