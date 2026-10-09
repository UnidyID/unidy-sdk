import * as z from "zod";
import type { ApiResponse, QueryParams } from "./base-client";
import type { ApiClientInterface } from "./base-service";
import { type MeListQuery, MeService, sortParam } from "./me-service";

const ItemSchema = z.object({ id: z.string(), name: z.string() });

class TestService extends MeService {
  page(query?: MeListQuery) {
    return this.fetchPage("/items", ItemSchema, query);
  }

  all() {
    return this.fetchAll("/items", ItemSchema);
  }

  one(id: string) {
    return this.fetchRecord(`/items/${id}`, ItemSchema);
  }

  create(data: object) {
    return this.write("POST", "/items", ItemSchema, { data });
  }

  remove(id: string) {
    return this.write("DELETE", `/items/${id}`, ItemSchema);
  }
}

const respond = (status: number, data: unknown, connectionError = false): ApiResponse<unknown> => ({
  status,
  data,
  success: status >= 200 && status < 300,
  headers: new Headers(),
  connectionError,
});

const PAGINATION = { strategy: "page", sort: "-created_at", page: 1, per_page: 50, count: 1, pages: 1, next: null, previous: null };

function setup(response: ApiResponse<unknown>, idToken: string | null = "id-token") {
  const mocks = {
    get: jest.fn(async (..._args: unknown[]) => response),
    post: jest.fn(async (..._args: unknown[]) => response),
    patch: jest.fn(async (..._args: unknown[]) => response),
    delete: jest.fn(async (..._args: unknown[]) => response),
  };
  const client = { baseUrl: "https://unidy.example", api_key: "key", ...mocks } as unknown as ApiClientInterface;
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
  const service = new TestService(client, "TestService", { getIdToken: async () => idToken, logger });

  return { client: mocks, service };
}

describe("MeService", () => {
  it("unwraps a page and sends sort and eq filters", async () => {
    const { client, service } = setup(
      respond(200, { records: [{ id: "1", name: "A" }], meta: { request_id: "r", pagination: PAGINATION } }),
    );

    const result = await service.page({ page: 2, perPage: 10, sort: "-starts_at", filters: { state: "active", payment_state: undefined } });

    expect(result).toEqual([null, { records: [{ id: "1", name: "A" }], pagination: PAGINATION }]);
    const params = client.get.mock.calls[0][2] as QueryParams;
    expect(client.get.mock.calls[0][0]).toBe("/api/v2/me/items");
    expect(params).toMatchObject({ page: 2, per_page: 10, sort: "-starts_at", "filter[state][eq]": "active" });
    expect(params["filter[payment_state][eq]"]).toBeUndefined();
  });

  it("skips a malformed record instead of failing the page", async () => {
    const { service } = setup(respond(200, { records: [{ id: "1", name: "A" }, { id: 2 }], meta: { pagination: PAGINATION } }));

    const [error, page] = await service.page();

    expect(error).toBeNull();
    expect(page && "records" in page ? page.records : []).toEqual([{ id: "1", name: "A" }]);
  });

  it("unwraps an unpaginated collection", async () => {
    const { service } = setup(respond(200, { records: [{ id: "1", name: "A" }], meta: { request_id: "r" } }));

    expect(await service.all()).toEqual([null, [{ id: "1", name: "A" }]]);
  });

  it("unwraps a record", async () => {
    const { service } = setup(respond(200, { record: { id: "1", name: "A" }, meta: { request_id: "r" } }));

    expect(await service.one("1")).toEqual([null, { id: "1", name: "A" }]);
  });

  it("wraps a write body in payload, and sends no body on DELETE", async () => {
    const { client, service } = setup(respond(201, { record: { id: "1", name: "A" }, meta: {} }));

    await service.create({ name: "A" });
    await service.remove("1");

    expect(client.post).toHaveBeenCalledWith("/api/v2/me/items", { payload: { data: { name: "A" } } }, { "X-ID-Token": "id-token" });
    expect(client.delete).toHaveBeenCalledWith("/api/v2/me/items/1", { "X-ID-Token": "id-token" });
  });

  it("returns a V2 error by its identifier, with the envelope", async () => {
    const body = {
      identifier: "unprocessable_content",
      details: [{ field: "payload.data.name", code: "blank" }],
      meta: { request_id: "r" },
    };
    const { service } = setup(respond(422, body));

    expect(await service.create({})).toEqual(["unprocessable_content", { identifier: body.identifier, details: body.details }]);
  });

  it("derives the identifier from the status when the body is not an envelope", async () => {
    const { service } = setup(respond(502, undefined));

    expect(await service.one("1")).toEqual(["internal_error", { identifier: "internal_error", details: [] }]);
  });

  it("reports a response that doesn't match the schema", async () => {
    const { service } = setup(respond(200, { record: { id: 1 } }));

    expect(await service.one("1")).toEqual(["invalid_response", null]);
  });

  it("needs a signed-in user", async () => {
    const { client, service } = setup(respond(200, {}), null);

    expect(await service.one("1")).toEqual(["missing_id_token", null]);
    expect(client.get).not.toHaveBeenCalled();
  });

  it("reports a connection failure", async () => {
    const { service } = setup(respond(0, undefined, true));

    expect(await service.one("1")).toEqual(["connection_failed", null]);
  });
});

describe("sortParam", () => {
  it("prefixes descending fields", () => {
    expect(sortParam("starts_at", "desc")).toBe("-starts_at");
    expect(sortParam("starts_at", "asc")).toBe("starts_at");
    expect(sortParam(undefined, "desc")).toBeUndefined();
  });
});
