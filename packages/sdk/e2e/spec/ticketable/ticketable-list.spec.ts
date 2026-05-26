import { routes } from "../../config";
import { expect, test } from "../../fixtures";

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
});

test.describe("u-ticketable-list - unauthenticated user", () => {
  test("shows signed-out copy and login link", async ({ page }) => {
    await page.goto(routes.ticketable);
    await expect(page.getByText("You need to sign in to view your tickets")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
