import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const ticketFixture = (overrides: Record<string, unknown> = {}) => ({
  id: "11111111-1111-4111-8111-111111111111",
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
  ...overrides,
});

const transferFixture = (overrides: Record<string, unknown> = {}) => ({
  token: "incomingToken123",
  status: "pending",
  recipient_email: "user@example.com",
  sender_email: "sender@example.com",
  expires_at: "2026-08-10T10:00:00.000Z",
  created_at: "2026-07-27T10:00:00.000Z",
  ticket: ticketFixture(),
  ...overrides,
});

const TRANSFERS_RESPONSE = {
  incoming: [transferFixture()],
  outgoing: [transferFixture({ token: "outgoingToken456", recipient_email: "friend@example.com", sender_email: "user@example.com" })],
};

const EMPTY_TRANSFERS_RESPONSE = { incoming: [], outgoing: [] };

const TICKETS_RESPONSE = {
  results: [ticketFixture()],
  meta: { count: 1, page: 1, limit: 5, last: 1, prev: null, next: null },
};

test.describe("ticket transfers - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    // The demo page also mounts a u-ticketable-list; keep it deterministic.
    // Registered first so the more specific transfer routes below take precedence.
    await page.route("**/api/sdk/v1/tickets**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TICKETS_RESPONSE) }),
    );
  });

  test("renders incoming and outgoing transfers", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.route("**/api/sdk/v1/ticket_transfers", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TRANSFERS_RESPONSE) }),
    );

    await page.goto(routes.ticketTransfers);

    await expect(page.getByText("From: sender@example.com")).toBeVisible();
    await expect(page.getByText("To: friend@example.com")).toBeVisible();
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
    await page.route("**/api/sdk/v1/ticket_transfers", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TRANSFERS_RESPONSE) }),
    );

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

    await page.route("**/api/sdk/v1/ticket_transfers", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(accepted ? EMPTY_TRANSFERS_RESPONSE : TRANSFERS_RESPONSE),
      }),
    );
    await page.route("**/api/sdk/v1/ticket_transfers/*/accept", (route) => {
      accepted = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(transferFixture({ status: "accepted" })),
      });
    });

    await page.goto(routes.ticketTransfers);

    const acceptRequest = page.waitForRequest(
      (req) => req.url().includes("/api/sdk/v1/ticket_transfers/incomingToken123/accept") && req.method() === "POST",
    );
    await page.getByRole("button", { name: "Accept" }).click();
    await acceptRequest;

    await expect(page.locator("#incoming-empty")).toBeVisible();
  });

  test("failed action surfaces the error via the error event", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.route("**/api/sdk/v1/ticket_transfers", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TRANSFERS_RESPONSE) }),
    );
    await page.route("**/api/sdk/v1/ticket_transfers/*/decline", (route) =>
      route.fulfill({ status: 410, contentType: "application/json", body: JSON.stringify({ error_identifier: "transfer_expired" }) }),
    );

    await page.goto(routes.ticketTransfers);
    await page.getByRole("button", { name: "Decline" }).click();

    await expect(page.locator("#transfer-flash")).toBeVisible();
    await expect(page.locator("#transfer-flash")).toContainText("transfer_expired");
    // The list keeps its items — only successful actions refetch.
    await expect(page.getByText("From: sender@example.com")).toBeVisible();
  });

  test("sends a transfer offer from the ticket form", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.route("**/api/sdk/v1/ticket_transfers", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TRANSFERS_RESPONSE) }),
    );
    await page.route("**/api/sdk/v1/tickets/*/transfer", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(transferFixture({ token: "newToken789", recipient_email: "bob@example.com" })),
      }),
    );

    await page.goto(routes.ticketTransfers);

    await page.getByPlaceholder("Enter the recipient's email").fill("bob@example.com");

    const createRequest = page.waitForRequest(
      (req) => req.url().includes("/api/sdk/v1/tickets/11111111-1111-4111-8111-111111111111/transfer") && req.method() === "POST",
    );
    await page.getByRole("button", { name: "Transfer ticket" }).click();
    const request = await createRequest;

    expect(request.postDataJSON()).toEqual({ recipient_email: "bob@example.com" });
    await expect(page.getByText("Transfer offer sent to bob@example.com")).toBeVisible();
  });

  test("shows a translated error when a transfer is already pending", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.route("**/api/sdk/v1/ticket_transfers", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TRANSFERS_RESPONSE) }),
    );
    await page.route("**/api/sdk/v1/tickets/*/transfer", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error_identifier: "transfer_already_pending" }),
      }),
    );

    await page.goto(routes.ticketTransfers);

    await page.getByPlaceholder("Enter the recipient's email").fill("bob@example.com");
    await page.getByRole("button", { name: "Transfer ticket" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "A transfer offer is already pending for this ticket" })).toBeVisible();
  });
});

test.describe("ticket transfers - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.ticketTransfers);
    await expect(page.getByText("You need to sign in to manage your ticket transfers")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
