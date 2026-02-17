import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../../config";

test.describe("Auth - Back Button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.auth);
  });

  test("back button navigates to previous step", async ({ page }) => {
    // Start at email step
    const email = page.getByRole("textbox", { name: "Email" });
    await expect(email).toBeVisible();

    // Submit email to go to verification step
    await email.fill(userLogin.email);
    await email.press("Enter");

    // Should be on verification step
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();

    // Click back button
    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible();
    await backButton.click();

    // Should be back on email step
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).not.toBeVisible();
  });

  test("back button preserves email when going back", async ({ page }) => {
    const email = page.getByRole("textbox", { name: "Email" });
    await email.fill(userLogin.email);
    await email.press("Enter");

    // Wait for verification step
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();

    // Go back
    const backButton = page.getByRole("button", { name: /back/i });
    await backButton.click();

    // Email should still be filled
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(userLogin.email);
  });

  test("back button works after page reload (step recovery)", async ({ page }) => {
    const email = page.getByRole("textbox", { name: "Email" });
    await email.fill(userLogin.email);
    await email.press("Enter");

    // Wait for verification step
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();

    // Reload the page - this triggers step recovery
    await page.reload();

    // Should still be on verification step after recovery
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();

    // Back button should work after recovery
    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible();
    await backButton.click();

    // Should navigate back to email step
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).not.toBeVisible();
  });
});
