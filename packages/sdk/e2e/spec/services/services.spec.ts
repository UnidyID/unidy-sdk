import { routes } from "../../config";
import { expect, test } from "../../fixtures";

test.describe("Services - Connected services (authenticated)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("shows connected services list", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.services);

    // Should show either the services list or the empty state
    const servicesList = page.locator("#services-list");
    const emptyState = page.locator("#services-empty");

    await expect(servicesList.or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test("loading state disappears after fetch", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.services);

    const loadingEl = page.locator("#services-loading");
    await expect(loadingEl).toBeHidden({ timeout: 10000 });
  });
});

test.describe("Services - Connected services (unauthenticated)", () => {
  test("shows login prompt when not authenticated", async ({ page }) => {
    await page.goto(routes.services);

    await expect(page.getByText(/you need to be signed in/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /go to login/i })).toBeVisible();
  });
});
