import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const EMPTY_TRANSACTIONS_RESPONSE = {
  results: [],
  meta: { count: 0, page: 1, limit: 10, last: 1, prev: null, next: null },
};

test.describe("u-transaction-list - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("renders transaction list when signed in", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.transaction);
    await expect(page.getByRole("heading", { name: "My Transactions", exact: true })).toBeVisible();
    const listHost = page.locator("u-transaction-list").first();
    await expect(listHost).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("pagination controls mount inside the transaction list", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.transaction);
    await expect(page.locator("u-pagination-button[direction='prev']")).toBeAttached();
    await expect(page.locator("u-pagination-button[direction='next']")).toBeAttached();
    await expect(page.locator("u-pagination-page")).toBeAttached();
  });

  test('shows slot="empty" content when the list returns zero items', async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.route("**/api/sdk/v1/transactions**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TRANSACTIONS_RESPONSE) }),
    );

    await page.goto(routes.transaction);

    await expect(page.locator("#empty-transactions-message")).toBeVisible();
    await expect(page.locator("#empty-transactions-message")).toHaveText("No transactions found.");
  });

  test('does not show slot="empty" content while loading', async ({ page, authenticatedContext: _authenticatedContext }) => {
    let releaseRoute!: () => void;
    const routeHeld = new Promise<void>((resolve) => {
      releaseRoute = resolve;
    });

    await page.route("**/api/sdk/v1/transactions**", async (route) => {
      await routeHeld;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EMPTY_TRANSACTIONS_RESPONSE) });
    });

    await Promise.all([page.waitForRequest((req) => req.url().includes("/api/sdk/v1/transactions")), page.goto(routes.transaction)]);

    // Component has made the request but response is held — still in loading state
    await expect(page.locator("#empty-transactions-message")).not.toBeVisible();
    releaseRoute();
  });
});

test.describe("u-transaction-list - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.transaction);
    await expect(page.getByText("You need to sign in to view your transactions")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
