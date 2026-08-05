import { routes } from "../../config";
import { expect, test } from "../../fixtures";
import { readSessionStorageFromFile } from "../../lib/helpers/session-storage";

test.describe("Logout → re-login (without page reload)", () => {
  const setAuthToken = async (page: import("@playwright/test").Page) => {
    const session = readSessionStorageFromFile();
    await page.evaluate((token: string) => {
      sessionStorage.setItem("unidy_token", token);
    }, session.unidy_token);
  };

  test("signin modal renders email step after logout without full page reload", async ({ page }) => {
    await page.goto(routes.auth);
    await setAuthToken(page);
    await page.reload();

    // Confirm authenticated state
    await expect(page.getByTestId("signed.in.view")).toBeVisible();

    // Logout via SDK button
    const logoutButton = page.getByRole("button", { name: "Logout" });
    await logoutButton.click();

    // After logout the email field must be visible — no hard reload
    await expect(page.getByRole("textbox", { name: /e-?mail/i })).toBeVisible();
  });
});
