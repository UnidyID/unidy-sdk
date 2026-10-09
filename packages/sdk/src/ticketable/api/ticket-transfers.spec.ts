import type { ApiResponse, QueryParams } from "../../api/base-client";
import type { ApiClientInterface } from "../../api/base-service";
import { TicketTransfersService } from "./ticket-transfers";

const TICKET_ID = "11111111-1111-4111-8111-111111111111";
const TRANSFER_ID = "44444444-4444-4444-8444-444444444444";

const respond = (status: number, data: unknown): ApiResponse<unknown> => ({
  status,
  data,
  success: status >= 200 && status < 300,
  headers: new Headers(),
  connectionError: false,
});

const pagination = (page: number, next: number | null) => ({
  strategy: "page",
  sort: "-created_at",
  page,
  per_page: 100,
  count: 2,
  pages: 2,
  next,
  previous: page > 1 ? page - 1 : null,
});

const transfer = (overrides: Record<string, unknown> = {}) => ({
  id: TRANSFER_ID,
  status: "pending",
  mode: "email",
  token: null,
  recipient_email: "user@example.com",
  expires_at: "2026-08-10T10:00:00.000Z",
  accepted_at: null,
  canceled_at: null,
  declined_at: null,
  reverted_at: null,
  created_at: "2026-07-27T10:00:00.000Z",
  updated_at: "2026-07-27T10:00:00.000Z",
  ticket_id: TICKET_ID,
  sender_id: "22222222-2222-4222-8222-222222222222",
  recipient_id: null,
  claim_url: null,
  direction: "incoming",
  sender_email: "sender@example.com",
  ticket: {
    id: TICKET_ID,
    title: "Concert Ticket",
    text: null,
    reference: "TCK-001",
    venue: null,
    seating: null,
    currency: "EUR",
    price: 49.99,
    starts_at: "2026-08-01T18:00:00.000Z",
    ends_at: null,
    ticket_category_id: "33333333-3333-4333-8333-333333333333",
  },
  ...overrides,
});

const ticket = {
  id: TICKET_ID,
  title: "Concert Ticket",
  text: null,
  reference: "TCK-001",
  metadata: {},
  wallet_export: {},
  state: "active",
  button_cta_url: null,
  info_banner: null,
  seating: null,
  venue: null,
  currency: "EUR",
  price: 49.99,
  starts_at: "2026-08-01T18:00:00.000Z",
  ends_at: null,
  entered_at: null,
  created_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-01T10:00:00.000Z",
  payment_state: "paid",
  ticket_category_id: "33333333-3333-4333-8333-333333333333",
  user_id: "22222222-2222-4222-8222-222222222222",
  holder_id: null,
  exportable_to_wallet: true,
};

const errorEnvelope = (identifier: string, details: object[]) => ({ identifier, details, meta: { request_id: "r" } });

function setup(...responses: ApiResponse<unknown>[]) {
  const next = async () => responses.shift() ?? respond(500, undefined);
  const client = {
    baseUrl: "https://unidy.example",
    api_key: "key",
    get: jest.fn((..._args: unknown[]) => next()),
    post: jest.fn((..._args: unknown[]) => next()),
    patch: jest.fn((..._args: unknown[]) => next()),
    delete: jest.fn((..._args: unknown[]) => next()),
  };
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
  const service = new TicketTransfersService(client as unknown as ApiClientInterface, { getIdToken: async () => "id-token", logger });

  return { client, service };
}

const HEADERS = { "X-ID-Token": "id-token" };

describe("TicketTransfersService", () => {
  describe("listing", () => {
    it("returns one page of offers in both directions", async () => {
      const outgoing = transfer({
        id: "55555555-5555-4555-8555-555555555555",
        direction: "outgoing",
        token: "tok",
        claim_url: "https://x",
      });
      const { client, service } = setup(respond(200, { records: [transfer(), outgoing], meta: { pagination: pagination(1, null) } }));

      const [error, page] = await service.list({ page: 1, perPage: 10 });

      expect(error).toBeNull();
      expect(page && "records" in page ? page.records.map((record) => record.direction) : []).toEqual(["incoming", "outgoing"]);
      expect(client.get.mock.calls[0][0]).toBe("/api/v2/me/tickets/transfers");
      expect(client.get.mock.calls[0][2] as QueryParams).toMatchObject({ page: 1, per_page: 10 });
    });

    it("follows the pagination to collect every open offer", async () => {
      const second = transfer({ id: "55555555-5555-4555-8555-555555555555", direction: "outgoing" });
      const { client, service } = setup(
        respond(200, { records: [transfer()], meta: { pagination: pagination(1, 2) } }),
        respond(200, { records: [second], meta: { pagination: pagination(2, null) } }),
      );

      const [error, transfers] = await service.listAll();

      expect(error).toBeNull();
      expect(Array.isArray(transfers) ? transfers.map((record) => record.id) : []).toEqual([TRANSFER_ID, second.id]);
      expect(client.get.mock.calls.map((call) => (call[2] as QueryParams).page)).toEqual([1, 2]);
    });

    it("stops at the first failing page", async () => {
      const { service } = setup(
        respond(200, { records: [transfer()], meta: { pagination: pagination(1, 2) } }),
        respond(403, errorEnvelope("feature_not_enabled", [{ field: "feature", code: "not_enabled", message: "enable_ticket_transfers" }])),
      );

      const [error] = await service.listAll();

      expect(error).toBe("feature_not_enabled");
    });

    it("parses dates and keeps a link offer's missing recipient", async () => {
      const { service } = setup(
        respond(200, { record: transfer({ mode: "link", recipient_email: null, direction: "outgoing" }), meta: { request_id: "r" } }),
      );

      const [, record] = await service.get({ id: TRANSFER_ID });

      expect(record).toMatchObject({ mode: "link", recipient_email: null, expires_at: new Date("2026-08-10T10:00:00.000Z") });
    });
  });

  describe("offers", () => {
    it("mails an offer by default", async () => {
      const { client, service } = setup(respond(201, { record: transfer({ direction: "outgoing" }) }));

      const [error] = await service.create({ ticketId: TICKET_ID, recipientEmail: "friend@example.com" });

      expect(error).toBeNull();
      expect(client.post).toHaveBeenCalledWith(
        "/api/v2/me/tickets/transfers",
        { payload: { data: { ticket_id: TICKET_ID, mode: "email", recipient_email: "friend@example.com" } } },
        HEADERS,
      );
    });

    it("opens a link offer without an address", async () => {
      const { client, service } = setup(
        respond(201, { record: transfer({ mode: "link", recipient_email: null, claim_url: "https://brand.example/claim/tok" }) }),
      );

      const [, created] = await service.create({ ticketId: TICKET_ID, mode: "link" });

      expect(client.post).toHaveBeenCalledWith(
        "/api/v2/me/tickets/transfers",
        { payload: { data: { ticket_id: TICKET_ID, mode: "link" } } },
        HEADERS,
      );
      expect(created).toMatchObject({ claim_url: "https://brand.example/claim/tok" });
    });

    it("accepts and declines by id, and cancels with DELETE", async () => {
      const { client, service } = setup(
        respond(200, { record: transfer({ status: "accepted" }) }),
        respond(200, { record: transfer({ status: "declined" }) }),
        respond(200, { record: transfer({ status: "canceled" }) }),
      );

      expect((await service.accept({ id: TRANSFER_ID }))[1]).toMatchObject({ status: "accepted" });
      expect((await service.decline({ id: TRANSFER_ID }))[1]).toMatchObject({ status: "declined" });
      expect((await service.cancel({ id: TRANSFER_ID }))[1]).toMatchObject({ status: "canceled" });

      expect(client.post.mock.calls.map((call) => call[0])).toEqual([
        `/api/v2/me/tickets/transfers/${TRANSFER_ID}/accept`,
        `/api/v2/me/tickets/transfers/${TRANSFER_ID}/decline`,
      ]);
      expect(client.delete).toHaveBeenCalledWith(`/api/v2/me/tickets/transfers/${TRANSFER_ID}`, HEADERS);
    });

    it("claims the offer behind a link by its token", async () => {
      const { client, service } = setup(respond(200, { record: transfer({ status: "accepted", mode: "link" }) }));

      const [error] = await service.claim({ token: "claimToken" });

      expect(error).toBeNull();
      expect(client.post).toHaveBeenCalledWith(
        "/api/v2/me/tickets/transfers/claim",
        { payload: { data: { token: "claimToken" } } },
        HEADERS,
      );
    });
  });

  describe("ending a lend", () => {
    it.each(["revoke", "return"] as const)("%s releases the holder and returns the ticket", async (action) => {
      const { client, service } = setup(respond(200, { record: ticket }));

      const [error, released] = await service[action]({ ticketId: TICKET_ID });

      expect(error).toBeNull();
      expect(released).toMatchObject({ id: TICKET_ID, holder_id: null });
      expect(client.delete).toHaveBeenCalledWith(`/api/v2/me/tickets/${TICKET_ID}/holder`, HEADERS);
    });
  });

  describe("errors", () => {
    it("names the transfer reason a 422 detail carries", async () => {
      const body = errorEnvelope("unprocessable_content", [
        { field: "payload.data.ticket_id", code: "invalid", message: "transfer_already_pending" },
      ]);
      const { service } = setup(respond(422, body));

      const result = await service.create({ ticketId: TICKET_ID, recipientEmail: "friend@example.com" });

      expect(result).toEqual(["transfer_already_pending", { identifier: "unprocessable_content", details: body.details }]);
    });

    it("reads the reason in front of a validation message", async () => {
      const { service } = setup(
        respond(
          422,
          errorEnvelope("unprocessable_content", [
            { field: "status", code: "invalid", message: "transfer_expired: created_at is too old" },
          ]),
        ),
      );

      expect((await service.accept({ id: TRANSFER_ID }))[0]).toBe("transfer_expired");
    });

    it("names the reason of a 403", async () => {
      const { service } = setup(
        respond(403, errorEnvelope("forbidden", [{ field: null, code: "invalid", message: "recipient_mismatch" }])),
      );

      expect((await service.accept({ id: TRANSFER_ID }))[0]).toBe("recipient_mismatch");
    });

    it("reports an unknown claim token as not_found", async () => {
      const { service } = setup(respond(422, errorEnvelope("unprocessable_content", [{ field: "payload.data.token", code: "not_found" }])));

      expect((await service.claim({ token: "nope" }))[0]).toBe("not_found");
    });

    it("keeps the V2 identifier when no transfer reason is named", async () => {
      const { service } = setup(
        respond(
          422,
          errorEnvelope("unprocessable_content", [
            {
              field: "payload.data.recipient_email",
              code: "format",
              message: "value at `/payload/data/recipient_email` does not match format: email",
            },
          ]),
        ),
        respond(404, errorEnvelope("not_found", [])),
        respond(403, errorEnvelope("feature_not_enabled", [{ field: "feature", code: "not_enabled", message: "enable_ticket_transfers" }])),
      );

      expect((await service.create({ ticketId: TICKET_ID, recipientEmail: "x" }))[0]).toBe("unprocessable_content");
      expect((await service.cancel({ id: TRANSFER_ID }))[0]).toBe("not_found");
      expect((await service.revoke({ ticketId: TICKET_ID }))[0]).toBe("feature_not_enabled");
    });
  });
});
