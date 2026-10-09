import type { Page, Route } from "@playwright/test";
import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const TICKET_ID = "11111111-1111-4111-8111-111111111111";
const INCOMING_ID = "44444444-4444-4444-8444-444444444444";
const OUTGOING_ID = "55555555-5555-4555-8555-555555555555";

const ticketFixture = (overrides: Record<string, unknown> = {}) => ({
  id: TICKET_ID,
  title: "Concert Ticket",
  reference: "TCK-001",
  exportable_to_wallet: false,
  state: "active",
  created_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-01T10:00:00.000Z",
  user_id: "22222222-2222-4222-8222-222222222222",
  metadata: {},
  wallet_export: {},
  payment_state: "paid",
  currency: "EUR",
  button_cta_url: null,
  text: null,
  info_banner: null,
  seating: null,
  venue: null,
  starts_at: "2026-08-01T18:00:00.000Z",
  ends_at: null,
  price: 49.99,
  ticket_category_id: "33333333-3333-4333-8333-333333333333",
  entered_at: null,
  holder_id: null,
  ...overrides,
});

const transferFixture = (overrides: Record<string, unknown> = {}) => ({
  id: INCOMING_ID,
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
  sender_id: "66666666-6666-4666-8666-666666666666",
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

const outgoingFixture = (overrides: Record<string, unknown> = {}) =>
  transferFixture({
    id: OUTGOING_ID,
    direction: "outgoing",
    token: "outgoingToken456",
    claim_url: "https://brand.example/ticket_transfers/outgoingToken456",
    recipient_email: "friend@example.com",
    sender_email: "user@example.com",
    ...overrides,
  });

const page1 = (records: unknown[]) => ({
  records,
  meta: {
    request_id: "req",
    pagination: {
      strategy: "page",
      sort: "-created_at",
      page: 1,
      per_page: 100,
      count: records.length,
      pages: 1,
      next: null,
      previous: null,
    },
  },
});

const TRANSFERS_RESPONSE = page1([transferFixture(), outgoingFixture()]);
const EMPTY_TRANSFERS_RESPONSE = page1([]);

const TICKETS_RESPONSE = page1([ticketFixture()]);

/** The tickets collection only, so the transfer routes under it stay unstubbed here. */
const TICKETS_COLLECTION = /\/api\/v2\/me\/tickets(\?.*)?$/;

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

const transferError = (identifier: string, details: object[]) => ({ identifier, details, meta: { request_id: "req" } });

/** The transfers collection: GET lists the open offers, POST creates one. */
const TRANSFERS_COLLECTION = /\/api\/v2\/me\/tickets\/transfers(\?.*)?$/;

/** Resolves with the detail of the next successful transfer action. */
const nextActionSuccess = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ action: string; transfer?: { status: string }; ticket?: { id: string } }>((resolve) => {
        document.addEventListener("uTicketTransferActionSuccess", (event) => resolve((event as CustomEvent).detail), { once: true });
      }),
  );

async function stubTransfers(page: Page, list: () => unknown, create?: (route: Route) => Promise<void>) {
  await page.route(TRANSFERS_COLLECTION, (route) => {
    if (route.request().method() === "POST" && create) return create(route);
    return json(route, 200, list());
  });
}

test.describe("ticket transfers - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    // The demo page also mounts two u-ticketable-lists; keep them deterministic.
    await page.route(TICKETS_COLLECTION, (route) => json(route, 200, TICKETS_RESPONSE));
  });

  test("renders incoming and outgoing transfers", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubTransfers(page, () => TRANSFERS_RESPONSE);

    await page.goto(routes.ticketTransfers);

    await expect(page.getByText("From: sender@example.com")).toBeVisible();
    await expect(page.getByText("To: friend@example.com")).toBeVisible();
    await expect(page.getByText("Transfer link: https://brand.example/ticket_transfers/outgoingToken456")).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Decline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel transfer" })).toBeVisible();
    // On schema-parse failure the lists render only an <h1> with the error prefix.
    await expect(page.locator("u-ticket-transfer-list h1")).toHaveCount(0);
    // Slotted empty content must stay hidden while items are rendered.
    await expect(page.locator("#incoming-empty")).not.toBeVisible();
    await expect(page.locator("#outgoing-empty")).not.toBeVisible();
  });

  test('shows slot="empty" content when there are no transfers', async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubTransfers(page, () => EMPTY_TRANSFERS_RESPONSE);

    await page.goto(routes.ticketTransfers);

    await expect(page.locator("#incoming-empty")).toBeVisible();
    await expect(page.locator("#incoming-empty")).toHaveText("No incoming transfers.");
    await expect(page.locator("#outgoing-empty")).toBeVisible();
  });

  test("accepting an incoming transfer posts to the API and refetches the list", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    let accepted = false;

    await stubTransfers(page, () => (accepted ? page1([outgoingFixture()]) : TRANSFERS_RESPONSE));
    await page.route(`**/api/v2/me/tickets/transfers/${INCOMING_ID}/accept`, (route) => {
      accepted = true;
      return json(route, 200, { record: transferFixture({ status: "accepted" }), meta: { request_id: "req" } });
    });

    await page.goto(routes.ticketTransfers);

    // Skeleton fragments briefly duplicate the action buttons — wait for the loaded item.
    await expect(page.getByRole("button", { name: "Accept" })).toHaveCount(1);

    const acceptRequest = page.waitForRequest(
      (req) => req.url().includes(`/api/v2/me/tickets/transfers/${INCOMING_ID}/accept`) && req.method() === "POST",
    );
    await page.getByRole("button", { name: "Accept" }).click();
    await acceptRequest;

    await expect(page.locator("#incoming-empty")).toBeVisible();
    await expect(page.getByText("To: friend@example.com")).toBeVisible();
  });

  test("cancelling an outgoing transfer deletes it", async ({ page, authenticatedContext: _authenticatedContext }) => {
    let canceled = false;

    await stubTransfers(page, () => (canceled ? page1([transferFixture()]) : TRANSFERS_RESPONSE));
    await page.route(`**/api/v2/me/tickets/transfers/${OUTGOING_ID}`, (route) => {
      canceled = true;
      return json(route, 200, { record: outgoingFixture({ status: "canceled" }), meta: { request_id: "req" } });
    });

    await page.goto(routes.ticketTransfers);

    await expect(page.getByRole("button", { name: "Cancel transfer" })).toHaveCount(1);

    const cancelRequest = page.waitForRequest(
      (req) => req.url().endsWith(`/api/v2/me/tickets/transfers/${OUTGOING_ID}`) && req.method() === "DELETE",
    );
    await page.getByRole("button", { name: "Cancel transfer" }).click();
    await cancelRequest;

    await expect(page.locator("#outgoing-empty")).toBeVisible();
  });

  test("failed action surfaces the transfer reason via the error event", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubTransfers(page, () => TRANSFERS_RESPONSE);
    await page.route(`**/api/v2/me/tickets/transfers/${INCOMING_ID}/decline`, (route) =>
      json(route, 422, transferError("unprocessable_content", [{ field: "status", code: "invalid", message: "transfer_expired" }])),
    );

    await page.goto(routes.ticketTransfers);

    await expect(page.getByRole("button", { name: "Decline" })).toHaveCount(1);
    await page.getByRole("button", { name: "Decline" }).click();

    await expect(page.locator("#transfer-flash")).toBeVisible();
    await expect(page.locator("#transfer-flash")).toContainText("transfer_expired");
    // The list keeps its items — only successful actions refetch.
    await expect(page.getByText("From: sender@example.com")).toBeVisible();
  });

  test("sends a transfer offer from the ticket form", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubTransfers(
      page,
      () => EMPTY_TRANSFERS_RESPONSE,
      (route) => json(route, 201, { record: outgoingFixture({ recipient_email: "bob@example.com" }), meta: { request_id: "req" } }),
    );

    await page.goto(routes.ticketTransfers);

    // The ticket list renders skeleton fragments (each containing a disabled form)
    // while loading — wait until exactly the one loaded form remains.
    await expect(page.getByPlaceholder("Enter the recipient's email")).toHaveCount(1);
    await page.getByPlaceholder("Enter the recipient's email").fill("bob@example.com");

    const createRequest = page.waitForRequest((req) => TRANSFERS_COLLECTION.test(req.url()) && req.method() === "POST");
    await page.getByRole("button", { name: "Transfer ticket" }).click();
    const request = await createRequest;

    expect(request.postDataJSON()).toEqual({
      payload: { data: { ticket_id: TICKET_ID, mode: "email", recipient_email: "bob@example.com" } },
    });
    await expect(page.getByText("Transfer offer sent to bob@example.com")).toBeVisible();
  });

  test("creates a transfer link and shows it", async ({ page, authenticatedContext: _authenticatedContext }) => {
    const claimUrl = "https://brand.example/ticket_transfers/linkToken789";
    await stubTransfers(
      page,
      () => EMPTY_TRANSFERS_RESPONSE,
      (route) =>
        json(route, 201, {
          record: outgoingFixture({ mode: "link", recipient_email: null, token: "linkToken789", claim_url: claimUrl }),
          meta: { request_id: "req" },
        }),
    );

    await page.goto(routes.ticketTransfers);

    await expect(page.getByRole("button", { name: "Create transfer link" })).toHaveCount(1);

    const createRequest = page.waitForRequest((req) => TRANSFERS_COLLECTION.test(req.url()) && req.method() === "POST");
    await page.getByRole("button", { name: "Create transfer link" }).click();
    const request = await createRequest;

    expect(request.postDataJSON()).toEqual({ payload: { data: { ticket_id: TICKET_ID, mode: "link" } } });
    await expect(page.getByText("Transfer link created. Share it with the recipient")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Transfer link" })).toHaveValue(claimUrl);
  });

  test("shows a translated error when a transfer is already pending", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubTransfers(
      page,
      () => EMPTY_TRANSFERS_RESPONSE,
      (route) =>
        json(
          route,
          422,
          transferError("unprocessable_content", [
            { field: "payload.data.ticket_id", code: "invalid", message: "transfer_already_pending" },
          ]),
        ),
    );

    await page.goto(routes.ticketTransfers);

    await expect(page.getByPlaceholder("Enter the recipient's email")).toHaveCount(1);
    await page.getByPlaceholder("Enter the recipient's email").fill("bob@example.com");
    await page.getByRole("button", { name: "Transfer ticket" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "A transfer offer is already pending for this ticket" })).toBeVisible();
  });

  test("claims the offer behind a transfer link", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubTransfers(page, () => EMPTY_TRANSFERS_RESPONSE);
    await page.route("**/api/v2/me/tickets/transfers/claim", (route) =>
      json(route, 200, { record: transferFixture({ status: "accepted", mode: "link" }), meta: { request_id: "req" } }),
    );

    await page.goto(`${routes.ticketTransfers}?token=claimToken123`);

    await expect(page.getByRole("heading", { name: "Claim a transfer link" })).toBeVisible();

    const claimRequest = page.waitForRequest((req) => req.url().endsWith("/api/v2/me/tickets/transfers/claim") && req.method() === "POST");
    const claimed = nextActionSuccess(page);
    await page.locator("#claim-action").getByRole("button", { name: "Accept" }).click();
    const request = await claimRequest;

    expect(request.postDataJSON()).toEqual({ payload: { data: { token: "claimToken123" } } });
    expect(await claimed).toMatchObject({ action: "accept", transfer: { status: "accepted" } });
  });

  test("revoking a lent ticket releases its holder", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubTransfers(page, () => EMPTY_TRANSFERS_RESPONSE);
    await page.route(`**/api/v2/me/tickets/${TICKET_ID}/holder`, (route) =>
      json(route, 200, { record: ticketFixture(), meta: { request_id: "req" } }),
    );

    await page.goto(routes.ticketTransfers);

    await expect(page.getByRole("button", { name: "Revoke transfer" })).toHaveCount(1);

    const revokeRequest = page.waitForRequest(
      (req) => req.url().endsWith(`/api/v2/me/tickets/${TICKET_ID}/holder`) && req.method() === "DELETE",
    );
    const revoked = nextActionSuccess(page);
    await page.getByRole("button", { name: "Revoke transfer" }).click();
    await revokeRequest;

    expect(await revoked).toMatchObject({ action: "revoke", ticket: { id: TICKET_ID } });
  });
});

test.describe("ticket transfers - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.ticketTransfers);
    await expect(page.getByText("You need to sign in to manage your ticket transfers")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
