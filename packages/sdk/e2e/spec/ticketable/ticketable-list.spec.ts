import { routes } from "../../config";
import { expect, test } from "../../fixtures";

test.describe("u-ticketable-list - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("renders ticketable list when signed in", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.ticketable);
    await expect(page.getByRole("heading", { name: "My Tickets", exact: true })).toBeVisible();
    const listHost = page.locator("u-ticketable-list").first();
    await expect(listHost).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("tolerates null metadata / wallet_export in the API response", async ({ page, authenticatedContext: _authenticatedContext }) => {
    // Reproduces UD-2531: a subscription/ticket payload where jsonb fields are
    // null or an empty array used to break Zod parsing and render nothing.
    await page.route("**/api/sdk/v1/tickets**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          meta: { count: 1, page: 1, limit: 10, last: 1, prev: null, next: null },
          results: [
            {
              id: "11111111-1111-1111-1111-111111111111",
              title: "Match Day Ticket",
              text: null,
              reference: "T-1",
              metadata: [],
              wallet_export: null,
              state: "active",
              payment_state: null,
              button_cta_url: null,
              info_banner: null,
              seating: null,
              venue: null,
              currency: null,
              ticket_category_id: "22222222-2222-2222-2222-222222222222",
              starts_at: "2026-01-15T10:30:00.000Z",
              ends_at: null,
              created_at: "2026-01-15T10:30:00.000Z",
              updated_at: "2026-01-15T10:30:00.000Z",
              price: null,
              user_id: "33333333-3333-3333-3333-333333333333",
              exportable_to_wallet: false,
            },
          ],
        }),
      });
    });

    await page.goto(routes.ticketable);
    await expect(page.getByText("Match Day Ticket")).toBeVisible();
    // No "errors." prefix should appear — the schema must have parsed cleanly.
    await expect(page.locator("u-ticketable-list h1")).toHaveCount(0);
  });

  test("pagination controls mount inside the ticketable list", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.ticketable);
    await expect(page.locator("u-pagination-button[direction='prev']")).toBeAttached();
    await expect(page.locator("u-pagination-button[direction='next']")).toBeAttached();
    await expect(page.locator("u-pagination-page")).toBeAttached();
  });
});

test.describe("u-ticketable-list - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.ticketable);
    await expect(page.getByText("You need to sign in to view your tickets")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
