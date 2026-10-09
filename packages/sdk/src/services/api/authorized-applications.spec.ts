import type { ApiResponse } from "../../api/base-client";
import type { ApiClientInterface } from "../../api/base-service";
import { AuthorizedApplicationsService } from "./authorized-applications";

const respond = (status: number, data: unknown): ApiResponse<unknown> => ({
  status,
  data,
  success: status >= 200 && status < 300,
  headers: new Headers(),
});

const PAGINATION = { strategy: "page", sort: "-authorized_at", page: 1, per_page: 50, count: 1, pages: 1, next: null, previous: null };

const APPLICATION = {
  id: "client/1",
  name: "Fan Shop",
  description: null,
  name_t: { en: "Fan Shop", de: "Fanshop" },
  description_t: {},
  service_logo_url: "https://unidy.example/rails/active_storage/blobs/logo.png",
  brands: { list: ["Default"], owner: ["Default"] },
  authorized_at: "2026-10-01T10:00:00.000Z",
};

function setup(response: ApiResponse<unknown>, idToken: string | null = "id-token") {
  const mocks = {
    get: jest.fn(async (..._args: unknown[]) => response),
    post: jest.fn(async (..._args: unknown[]) => response),
    patch: jest.fn(async (..._args: unknown[]) => response),
    delete: jest.fn(async (..._args: unknown[]) => response),
  };
  const client = { baseUrl: "https://unidy.example", api_key: "key", ...mocks } as unknown as ApiClientInterface;
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };

  return { mocks, service: new AuthorizedApplicationsService(client, { getIdToken: async () => idToken, logger }) };
}

describe("AuthorizedApplicationsService", () => {
  it("lists a page of the applications the user authorized", async () => {
    const { mocks, service } = setup(respond(200, { records: [APPLICATION], meta: { request_id: "r", pagination: PAGINATION } }));

    const result = await service.list({ perPage: 10 });

    expect(result).toEqual([null, { records: [APPLICATION], pagination: PAGINATION }]);
    expect(mocks.get).toHaveBeenCalledWith(
      "/api/v2/me/authorized_applications",
      { "X-ID-Token": "id-token" },
      expect.objectContaining({ per_page: 10 }),
    );
  });

  it("revokes an application by its client id and returns it as it was", async () => {
    const { mocks, service } = setup(respond(200, { record: APPLICATION, meta: { request_id: "r" } }));

    expect(await service.revoke("client/1")).toEqual([null, APPLICATION]);
    expect(mocks.delete).toHaveBeenCalledWith("/api/v2/me/authorized_applications/client%2F1", { "X-ID-Token": "id-token" });
  });

  it("returns not_found for an application the user never authorized", async () => {
    const { service } = setup(respond(404, { identifier: "not_found", details: [], meta: { request_id: "r" } }));

    expect(await service.revoke("unknown")).toEqual(["not_found", { identifier: "not_found", details: [] }]);
  });

  it("needs a signed-in user", async () => {
    const { mocks, service } = setup(respond(200, {}), null);

    expect(await service.list()).toEqual(["missing_id_token", null]);
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
