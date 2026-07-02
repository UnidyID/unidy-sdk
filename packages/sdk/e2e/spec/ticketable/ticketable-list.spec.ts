import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const FAKE_TICKET = {
  id: "00000000-0000-0000-0000-000000000001",
  title: "Test Ticket",
  reference: "REF-001",
  exportable_to_wallet: false,
  state: "active",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  user_id: "00000000-0000-0000-0000-000000000002",
  metadata: null,
  wallet_export: null,
  payment_state: null,
  currency: null,
  button_cta_url: null,
  text: null,
  info_banner: null,
  seating: null,
  venue: null,
  starts_at: "2024-06-01T00:00:00.000Z",
  ends_at: null,
  price: null,
  ticket_category_id: "00000000-0000-0000-0000-000000000003",
};

const paginatedResponse = (page: number, last: number) => ({
  results: [FAKE_TICKET],
  meta: { count: last * 10, page, limit: 10, last, prev: page > 1 ? page - 1 : null, next: page < last ? page + 1 : null },
});

test.describe("u-ticketable-list - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("renders ticketable list when signed in", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.ticketable);
    await expect(page.getByRole("heading", { name: "My Tickets", exact: true })).toBeVisible();
    const listHost = page.locator("u-ticketable-list").first();
    await expect(listHost).toBeVisible();
    // On schema-parse failure the component renders only an <h1> with the error
    // prefix — make sure that never reaches the DOM (regression guard for UD-2531).
    await expect(listHost.locator("h1")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("pagination controls mount inside the ticketable list", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.ticketable);
    await expect(page.locator("u-pagination-button[direction='prev']")).toBeAttached();
    await expect(page.locator("u-pagination-button[direction='next']")).toBeAttached();
    await expect(page.locator("u-pagination-page")).toBeAttached();
  });

  test("pagination controls render and reflect pagination meta without a manually wired store", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    await page.route("**/api/sdk/v1/tickets**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(paginatedResponse(1, 3)) }),
    );

    await page.goto(routes.ticketable);

    // prev disabled on first page, next enabled — store must have been created automatically
    await expect(page.locator("u-pagination-button[direction='prev'] button")).toBeVisible();
    await expect(page.locator("u-pagination-button[direction='prev'] button")).toBeDisabled();
    await expect(page.locator("u-pagination-button[direction='next'] button")).toBeVisible();
    await expect(page.locator("u-pagination-button[direction='next'] button")).toBeEnabled();
    await expect(page.locator("u-pagination-page")).toContainText("Page 1 of 3");
  });
});

test.describe("u-ticketable-list - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.ticketable);
    await expect(page.getByText("You need to sign in to view your tickets")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
