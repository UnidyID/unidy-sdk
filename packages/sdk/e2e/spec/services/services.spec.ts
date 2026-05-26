import { routes } from "../../config";
import { expect, test } from "../../fixtures";

test.describe("Services - Connected services (authenticated)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("renders the services page", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.services);

    await expect(page.getByRole("heading", { name: "Connected Services" })).toBeVisible();
    await expect(page.locator("#services-list")).toBeAttached();
  });
});

test.describe("Services - Connected services (unauthenticated)", () => {
  test("shows login prompt when not authenticated", async ({ page }) => {
    await page.goto(routes.services);

    await expect(page.getByText(/you need to be signed in/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /go to login/i })).toBeVisible();
  });
});
