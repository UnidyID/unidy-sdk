import { expect, test } from "@playwright/test";
import { routes } from "../../../config";

test.describe("Auth - Brand Connect Flow", () => {
  test("displays brand connect step when redirected with brand_connection_required error", async ({ page }) => {
    // Navigate to auth page with brand_connection_required error and a mock SID
    await page.goto(`${routes.auth}?error=brand_connection_required&sid=test-sign-in-id`);

    // Should show the connect-brand step
    await expect(page.getByRole("heading", { name: /connect your account/i })).toBeVisible();
    await expect(page.getByText(/would you like to connect your unidy account/i)).toBeVisible();
  });

  test("shows connect and cancel buttons in brand connect step", async ({ page }) => {
    await page.goto(`${routes.auth}?error=brand_connection_required&sid=test-sign-in-id`);

    // Should show both connect and cancel buttons
    const connectButton = page.getByRole("button", { name: /connect/i });
    const cancelButton = page.getByRole("button", { name: /cancel/i });

    await expect(connectButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
  });

  test("cancel button returns to initial step", async ({ page }) => {
    await page.goto(`${routes.auth}?error=brand_connection_required&sid=test-sign-in-id`);

    // Click cancel button
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();

    // Should return to email step
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  });
});
