import { expect, test } from "@playwright/test";
import { routes } from "../../../config";

test.describe("Auth - Invited step", () => {
  test("navigates to invited step when API returns account_unconfirmed with login_type: invited", async ({ page }) => {
    await page.route(/\/api\/sdk\/v1\/sign_ins$/, (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error_identifier: "account_unconfirmed", login_type: "invited" }),
      }),
    );

    await page.goto(routes.auth);

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill("invited@example.com");
    await emailInput.press("Enter");

    await expect(page.getByRole("heading", { name: "Accept your invitation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Resend invitation email" })).toBeVisible();
  });

  test("disables the resend button after clicking it", async ({ page }) => {
    await page.route(/\/api\/sdk\/v1\/sign_ins$/, (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error_identifier: "account_unconfirmed", login_type: "invited" }),
      }),
    );

    await page.route(/\/api\/sdk\/v1\/sign_ins\/resend_invitation$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ enable_resend_after: 60 }),
      }),
    );

    await page.goto(routes.auth);

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill("invited@example.com");
    await emailInput.press("Enter");

    const resendButton = page.getByRole("button", { name: "Resend invitation email" });
    await expect(resendButton).toBeEnabled();
    await resendButton.click();
    await expect(resendButton).toBeDisabled();
  });

  test("allows navigating back to the email step", async ({ page }) => {
    await page.route(/\/api\/sdk\/v1\/sign_ins$/, (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error_identifier: "account_unconfirmed", login_type: "invited" }),
      }),
    );

    await page.goto(routes.auth);

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill("invited@example.com");
    await emailInput.press("Enter");

    await expect(page.getByRole("heading", { name: "Accept your invitation" })).toBeVisible();

    await page.getByRole("button", { name: "← Back" }).click();

    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue("invited@example.com");
  });
});
