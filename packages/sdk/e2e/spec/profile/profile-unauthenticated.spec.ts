import { expect, test } from "@playwright/test";
import { routes } from "../../config";

test.describe("Profile - unauthenticated user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.profile);
  });

  test("profile page shows signed out state", async ({ page }) => {
    await page.goto(routes.profile);
    await expect(page.getByText("You need to sign in to view")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
