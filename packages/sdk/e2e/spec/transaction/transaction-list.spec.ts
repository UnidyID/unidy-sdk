import { routes } from "../../config";
import { expect, test } from "../../fixtures";

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
});

test.describe("u-transaction-list - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.transaction);
    await expect(page.getByText("You need to sign in to view your transactions")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
