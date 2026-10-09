import type { ApiResponse, QueryParams } from "../../api/base-client";
import type { ApiClientInterface } from "../../api/base-service";
import { MeNewsletterService } from "./me-newsletters";

const MAIN_ID = "11111111-1111-4111-8111-111111111111";
const TEST_ID = "22222222-2222-4222-8222-222222222222";
const NEW_ID = "33333333-3333-4333-8333-333333333333";
const NOW = "2026-10-01T10:00:00.000Z";

const respond = (status: number, data: unknown): ApiResponse<unknown> => ({
  status,
  data,
  success: status >= 200 && status < 300,
  headers: new Headers(),
});

const pagination = (count: number, page = 1, next: number | null = null) => ({
  strategy: "page",
  sort: "-created_at",
  page,
  per_page: 500,
  count,
  pages: next ? next : page,
  next,
  previous: page > 1 ? page - 1 : null,
});

const newsletter = (id: string, slug: string) => ({
  id,
  slug,
  default: false,
  opt_in_type: "doi",
  doi_through_unidy: true,
  brands: ["Default"],
  title: slug,
  description: null,
  title_t: { en: slug },
  description_t: {},
  created_at: NOW,
  updated_at: NOW,
});

const subscription = (newsletterId: string, overrides: Record<string, unknown> = {}) => ({
  id: `sub-${newsletterId}`,
  email: "ada@example.com",
  newsletter_id: newsletterId,
  user_id: "user-1",
  preference_identifiers: ["weekly"],
  confirmed_at: NOW,
  confirmation_requested_at: null,
  opted_out_at: null,
  created_at: NOW,
  updated_at: NOW,
  ...overrides,
});

const page = (records: unknown[], meta = pagination(records.length)) =>
  respond(200, { records, meta: { request_id: "r", pagination: meta } });
const record = (data: unknown, status = 200) => respond(status, { record: data, meta: { request_id: "r" } });

type Handler = (method: string, endpoint: string, params?: QueryParams, body?: object) => ApiResponse<unknown>;

function setup(handler: Handler, idToken: string | null = "id-token") {
  const mocks = {
    get: jest.fn(async (endpoint: string, _headers?: HeadersInit, params?: QueryParams) => handler("GET", endpoint, params)),
    post: jest.fn(async (endpoint: string, body: object) => handler("POST", endpoint, undefined, body)),
    patch: jest.fn(async (endpoint: string, body: object) => handler("PATCH", endpoint, undefined, body)),
    delete: jest.fn(async (endpoint: string) => handler("DELETE", endpoint)),
  };
  const client = { baseUrl: "https://unidy.example", api_key: "key", ...mocks } as unknown as ApiClientInterface;
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
  const service = new MeNewsletterService(client, { getIdToken: async () => idToken, logger });

  const catalogRequests = () => mocks.get.mock.calls.filter(([endpoint]) => endpoint === "/api/v2/me/newsletters");
  return { mocks, service, logger, catalogRequests };
}

/** Serves the catalog, then whatever `rest` answers for the subscription endpoints. */
function withCatalog(catalog: () => unknown[], rest: Handler = () => respond(500, undefined)): Handler {
  return (method, endpoint, params, body) =>
    endpoint === "/api/v2/me/newsletters" ? page(catalog()) : rest(method, endpoint, params, body);
}

describe("MeNewsletterService", () => {
  const catalog = () => [newsletter(MAIN_ID, "main"), newsletter(TEST_ID, "test")];

  it("subscribes by slug, sending the newsletter's id and the redirect in the payload", async () => {
    const { mocks, service } = setup(withCatalog(catalog, () => record(subscription(TEST_ID, { confirmed_at: null }), 201)));

    const [error, created] = await service.create({
      slug: "test",
      preferenceIdentifiers: ["weekly"],
      redirectToAfterConfirmation: "https://shop.example/nl",
    });

    expect(error).toBeNull();
    expect(created).toMatchObject({ newsletter_id: TEST_ID, newsletter_slug: "test", confirmed_at: null });
    expect(mocks.post).toHaveBeenCalledWith(
      "/api/v2/me/newsletter_subscriptions",
      {
        payload: {
          data: { newsletter_id: TEST_ID, preference_identifiers: ["weekly"] },
          redirect_to_after_confirmation: "https://shop.example/nl",
        },
      },
      { "X-ID-Token": "id-token" },
    );
  });

  it("loads the newsletters once for every slug it resolves", async () => {
    const { service, catalogRequests } = setup(
      withCatalog(catalog, (_m, endpoint) => record(subscription(endpoint.includes(MAIN_ID) ? MAIN_ID : TEST_ID))),
    );

    await Promise.all([service.get({ slug: "main" }), service.get({ slug: "test" }), service.delete({ slug: "main" })]);

    expect(catalogRequests()).toHaveLength(1);
    expect(catalogRequests()[0][2]).toMatchObject({ page: 1, per_page: 500 });
  });

  it("addresses a subscription by its newsletter's id", async () => {
    const { mocks, service } = setup(withCatalog(catalog, () => record(subscription(MAIN_ID, { preference_identifiers: [] }))));

    await service.update({ slug: "main", preferenceIdentifiers: [] });
    await service.delete({ newsletterId: MAIN_ID });
    await service.requestConfirmation({ slug: "main", redirectToAfterConfirmation: "https://shop.example/nl" });

    expect(mocks.patch).toHaveBeenCalledWith(
      `/api/v2/me/newsletter_subscriptions/${MAIN_ID}`,
      { payload: { data: { preference_identifiers: [] } } },
      { "X-ID-Token": "id-token" },
    );
    expect(mocks.delete).toHaveBeenCalledWith(`/api/v2/me/newsletter_subscriptions/${MAIN_ID}`, { "X-ID-Token": "id-token" });
    expect(mocks.post).toHaveBeenCalledWith(
      `/api/v2/me/newsletter_subscriptions/${MAIN_ID}/request_confirmation`,
      { payload: { data: {}, redirect_to_after_confirmation: "https://shop.example/nl" } },
      { "X-ID-Token": "id-token" },
    );
  });

  it("reloads the newsletters once for a slug it hasn't seen, since the newsletter may be new", async () => {
    let newsletters = catalog();
    const { service, catalogRequests } = setup(
      withCatalog(
        () => newsletters,
        () => record(subscription(NEW_ID)),
      ),
    );

    await service.get({ slug: "main" });
    newsletters = [...catalog(), newsletter(NEW_ID, "new")];
    const [error, found] = await service.get({ slug: "new" });

    expect(error).toBeNull();
    expect(found).toMatchObject({ newsletter_slug: "new" });
    expect(catalogRequests()).toHaveLength(2);
  });

  it("answers not_found for a slug the brand doesn't have, without calling the subscription endpoint", async () => {
    const { mocks, service, catalogRequests } = setup(withCatalog(catalog));

    const result = await service.create({ slug: "unknown" });

    expect(result).toEqual([
      "not_found",
      { identifier: "not_found", details: [expect.objectContaining({ field: "slug", code: "not_found" })] },
    ]);
    expect(mocks.post).not.toHaveBeenCalled();
    // A catalog loaded by this very call is fresh, so it isn't reloaded.
    expect(catalogRequests()).toHaveLength(1);
  });

  it("returns a V2 error of the subscription endpoint as it came", async () => {
    const taken = { identifier: "unprocessable_content", details: [{ field: "payload.data.newsletter_id", code: "taken" }] };
    const { service } = setup(withCatalog(catalog, () => respond(422, { ...taken, meta: { request_id: "r" } })));

    expect(await service.create({ slug: "main" })).toEqual(["unprocessable_content", taken]);
  });

  it("follows the pages of the newsletters", async () => {
    const { mocks, service } = setup((_method, endpoint, params) => {
      if (endpoint !== "/api/v2/me/newsletters") return record(subscription(TEST_ID));
      return params?.page === 1
        ? page([newsletter(MAIN_ID, "main")], pagination(2, 1, 2))
        : page([newsletter(TEST_ID, "test")], pagination(2, 2, null));
    });

    const [error] = await service.get({ slug: "test" });

    expect(error).toBeNull();
    expect(mocks.get.mock.calls.filter(([endpoint]) => endpoint === "/api/v2/me/newsletters").map(([, , params]) => params?.page)).toEqual([
      1, 2,
    ]);
  });

  it("lists every subscription with its newsletter's slug", async () => {
    const { service } = setup(
      withCatalog(catalog, (_method, endpoint) =>
        endpoint === "/api/v2/me/newsletter_subscriptions" ? page([subscription(MAIN_ID), subscription(TEST_ID)]) : respond(500, undefined),
      ),
    );

    const [error, subscriptions] = await service.listAll();

    expect(error).toBeNull();
    expect((subscriptions as { newsletter_slug: string }[]).map((s) => s.newsletter_slug)).toEqual(["main", "test"]);
  });

  it("skips a subscription whose newsletter isn't listed, after reloading the newsletters once", async () => {
    const { service, logger, catalogRequests } = setup(
      withCatalog(catalog, (_method, endpoint) =>
        endpoint === "/api/v2/me/newsletter_subscriptions"
          ? page([subscription(MAIN_ID), subscription(NEW_ID)])
          : record(subscription(MAIN_ID)),
      ),
    );
    await service.get({ slug: "main" });

    const [error, result] = await service.list();

    expect(error).toBeNull();
    expect(result).toMatchObject({ records: [{ newsletter_slug: "main" }], pagination: { count: 2 } });
    expect(catalogRequests()).toHaveLength(2);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(NEW_ID));
  });

  it("doesn't keep a failed newsletter load", async () => {
    let fail = true;
    const disabled = { identifier: "feature_not_enabled", details: [] };
    const { service, catalogRequests } = setup((_method, endpoint) => {
      if (endpoint === "/api/v2/me/newsletters") return fail ? respond(403, disabled) : page(catalog());
      return record(subscription(MAIN_ID));
    });

    expect(await service.get({ slug: "main" })).toEqual(["feature_not_enabled", disabled]);
    fail = false;
    const [error] = await service.get({ slug: "main" });

    expect(error).toBeNull();
    expect(catalogRequests()).toHaveLength(2);
  });

  it("needs a signed-in user", async () => {
    const { mocks, service } = setup(withCatalog(catalog), null);

    expect(await service.listAll()).toEqual(["missing_id_token", null]);
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
