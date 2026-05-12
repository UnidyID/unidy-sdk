import { routes } from "../../config";
import { expect, test } from "../../fixtures";

test.describe("Services - Connected services (authenticated)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("shows connected services or empty state after loading", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.services);

    // Wait for loading to finish
    await expect(page.locator("#services-loading")).toBeHidden({ timeout: 10000 });

    // Either the list has items or the empty state is shown
    const hasServices = await page.locator("#services-list li").count();
    if (hasServices > 0) {
      await expect(page.locator("#services-list li").first()).toBeVisible();
    } else {
      await expect(page.locator("#services-empty")).toBeVisible();
    }
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
