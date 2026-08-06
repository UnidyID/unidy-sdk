import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const paginatedResponse = (page: number, last: number) => ({
  results: [],
  meta: { count: last * 10, page, limit: 10, last, prev: page > 1 ? page - 1 : null, next: page < last ? page + 1 : null },
});

const EMPTY_TICKETS_RESPONSE = {
  results: [],
  meta: { count: 0, page: 1, limit: 10, last: 1, prev: null, next: null },
};

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

    // Track both ticket API responses (one per u-ticketable-list on the demo page).
    // The pagination controls live in the second list, so we must wait for that
    // list's loadData() to complete before asserting on the store state.
    let responseCount = 0;
    const bothResponsesReceived = new Promise<void>((resolve) => {
      page.on("response", (resp) => {
        if (resp.url().includes("/api/sdk/v1/tickets") && resp.status() === 200 && ++responseCount >= 2) {
          resolve();
        }
      });
    });

    await page.goto(routes.ticketable);
    await bothResponsesReceived;

    // prev disabled on first page, next enabled — store must have been created automatically
    await expect(page.locator("u-pagination-button[direction='prev'] button")).toBeVisible();
    await expect(page.locator("u-pagination-button[direction='prev'] button")).toBeDisabled();
    await expect(page.locator("u-pagination-button[direction='next'] button")).toBeVisible();
    await expect(page.locator("u-pagination-button[direction='next'] button")).toBeEnabled();
    await expect(page.locator("u-pagination-page")).toContainText("Page 1 of 3");
  });

  test('shows slot="empty" content when the list returns zero items', async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.route("**/api/sdk/v1/tickets**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TICKETS_RESPONSE) }),
    );

    await page.goto(routes.ticketable);

    await expect(page.locator("#empty-message")).toBeVisible();
    await expect(page.locator("#empty-message")).toHaveText("No tickets found.");
  });

  test('does not show slot="empty" content while loading', async ({ page, authenticatedContext: _authenticatedContext }) => {
    let releaseRoute!: () => void;
    const routeHeld = new Promise<void>((resolve) => {
      releaseRoute = resolve;
    });

    await page.route("**/api/sdk/v1/tickets**", async (route) => {
      await routeHeld;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TICKETS_RESPONSE) });
    });

    await Promise.all([page.waitForRequest((req) => req.url().includes("/api/sdk/v1/tickets")), page.goto(routes.ticketable)]);

    // Component has made the request but response is held — still in loading state
    await expect(page.locator("#empty-message")).not.toBeVisible();
    releaseRoute();
  });
});

test.describe("u-ticketable-list - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.ticketable);
    await expect(page.getByText("You need to sign in to view your tickets")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
