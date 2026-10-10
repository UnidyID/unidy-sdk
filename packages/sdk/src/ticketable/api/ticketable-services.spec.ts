import type { ApiResponse, QueryParams } from "../../api/base-client";
import type { ApiClientInterface } from "../../api/base-service";
import { TransactionsService } from "../../transaction/api/transactions";
import { SubscriptionsService } from "./subscriptions";
import { TicketsService } from "./tickets";

const EMPTY_PAGE: ApiResponse<unknown> = {
  status: 200,
  success: true,
  headers: new Headers(),
  data: {
    records: [],
    meta: { pagination: { strategy: "page", sort: "-created_at", page: 1, per_page: 10, count: 0, pages: 0, next: null, previous: null } },
  },
};

function mockClient(response: ApiResponse<unknown> = EMPTY_PAGE) {
  const mocks = {
    get: jest.fn(async (..._args: unknown[]) => response),
    post: jest.fn(async (..._args: unknown[]) => response),
    patch: jest.fn(async (..._args: unknown[]) => response),
    delete: jest.fn(async (..._args: unknown[]) => response),
  };
  const client = { baseUrl: "https://unidy.example", api_key: "key", ...mocks } as unknown as ApiClientInterface;

  return { client, mocks };
}

const deps = {
  getIdToken: async () => "id-token",
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
};

describe("TicketsService", () => {
  it("lists /me/tickets with eq filters and a signed sort", async () => {
    const { client, mocks } = mockClient();

    await new TicketsService(client, deps).list({
      page: 2,
      perPage: 5,
      state: "active",
      paymentState: "paid",
      ticketCategoryId: "cat-1",
      orderBy: "starts_at",
      orderDirection: "desc",
    });

    expect(mocks.get.mock.calls[0][0]).toBe("/api/v2/me/tickets");
    expect(mocks.get.mock.calls[0][2] as QueryParams).toMatchObject({
      page: 2,
      per_page: 5,
      sort: "-starts_at",
      "filter[state][eq]": "active",
      "filter[payment_state][eq]": "paid",
      "filter[ticket_category_id][eq]": "cat-1",
    });
  });

  it("refuses a page size V2 would reject", async () => {
    const { client, mocks } = mockClient();

    expect(await new TicketsService(client, deps).list({ perPage: 501 })).toEqual(["invalid_response", null]);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("requests an export link through /exports", async () => {
    const link = {
      format: "pdf",
      download_url: "https://unidy.example/api/sdk/v1/ticketables/abc",
      expires_at: "2026-10-09T12:00:00.000Z",
    };
    const { client, mocks } = mockClient({ status: 201, success: true, headers: new Headers(), data: { record: link, meta: {} } });

    const [error, data] = await new TicketsService(client, deps).getExportLink({ id: "t-1", format: "pdf" });

    expect(error).toBeNull();
    expect(data).toEqual({ ...link, expires_at: new Date(link.expires_at) });
    expect(mocks.post).toHaveBeenCalledWith(
      "/api/v2/me/tickets/t-1/exports",
      { payload: { data: { format: "pdf" } } },
      { "X-ID-Token": "id-token" },
    );
  });
});

describe("SubscriptionsService", () => {
  it("filters by subscription category", async () => {
    const { client, mocks } = mockClient();

    await new SubscriptionsService(client, deps).list({ subscriptionCategoryId: "cat-2" });

    expect(mocks.get.mock.calls[0][0]).toBe("/api/v2/me/subscriptions");
    expect(mocks.get.mock.calls[0][2] as QueryParams).toMatchObject({ "filter[subscription_category_id][eq]": "cat-2" });
  });
});

describe("TransactionsService", () => {
  it("maps the list arguments onto V2 filters", async () => {
    const { client, mocks } = mockClient();

    await new TransactionsService(client, deps).list({
      financialStatus: "paid",
      orderType: "online",
      sourcePlatform: "shopify",
      externalId: "ext-1",
      orderBy: "placed_at",
    });

    expect(mocks.get.mock.calls[0][0]).toBe("/api/v2/me/transactions");
    expect(mocks.get.mock.calls[0][2] as QueryParams).toMatchObject({
      sort: "placed_at",
      "filter[financial_status][eq]": "paid",
      "filter[order_type][eq]": "online",
      "filter[source_platform][eq]": "shopify",
      "filter[external_id][eq]": "ext-1",
    });
  });
});
