import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../../config";

test.describe("Auth - Passkey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.auth);
  });

  test("should show passkey button", async ({ page }) => {
    const passkeyButton = page.getByRole("button", { name: "Sign in with Passkey" });
    await expect(passkeyButton).toBeVisible();
    // TODO: Add more tests
  });
});
