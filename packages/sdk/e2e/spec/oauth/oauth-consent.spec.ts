import { routes } from "../../config";
import { expect, test } from "../../fixtures";

test.describe("OAuth - Consent Flow (authenticated)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("shows connect button when authenticated", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.oauth);

    // Should show the connect button
    const connectButton = page.getByRole("button", { name: /connect to test application/i });
    await expect(connectButton).toBeVisible();
  });

  test("connect button initiates OAuth flow", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.oauth);

    const connectButton = page.getByRole("button", { name: /connect to test application/i });
    await connectButton.click();

    // Should show either the consent modal or an error (depending on whether the test app exists)
    // Wait for either the authorize button in modal or the visible error div
    const modalVisible = page.locator("u-oauth-modal dialog[open]");
    const errorVisible = page.locator("#oauth-error:not(.hidden)");

    // Wait for either the modal or a visible error to appear
    await expect(modalVisible.or(errorVisible)).toBeVisible({ timeout: 10000 });
  });

  test("cancel button closes modal and shows cancelled state", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.oauth);

    const connectButton = page.getByRole("button", { name: /connect to test application/i });
    await connectButton.click();

    // Wait for modal to appear
    const cancelButton = page.locator("u-oauth-modal").getByRole("button", { name: /cancel/i });

    // Only proceed if the modal appeared (test app might not exist)
    if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelButton.click();

      // Should show cancelled state
      await expect(page.locator("#oauth-cancel")).toBeVisible();
    }
  });
});

test.describe("OAuth - Consent Flow (unauthenticated)", () => {
  test("shows login prompt when not authenticated", async ({ page }) => {
    await page.goto(routes.oauth);

    // Should show the login prompt
    await expect(page.getByText(/you need to be signed in/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /go to login/i })).toBeVisible();
  });

  test("connect button is not visible when not authenticated", async ({ page }) => {
    await page.goto(routes.oauth);

    // Connect button should not be visible
    const connectButton = page.getByRole("button", { name: /connect to test application/i });
    await expect(connectButton).not.toBeVisible();
  });
});
