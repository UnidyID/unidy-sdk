import { expect, test } from "@playwright/test";
import { routes } from "../../config";

test.describe("Auth - Social login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.auth);
  });

  test("shows social login button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });
});
