import { expect, test } from "@playwright/test";
import { routes } from "../../../config";
import { Database } from "../../../lib/database";
import { randomEmail } from "../../../lib/helpers/random";

async function createUnconfirmedUser(email: string) {
  const users = new Database("User", { scope: { email } });
  await users.create({
    email,
    confirmed_at: null,
    // Place confirmation_sent_at well outside the resend rate-limit window so the resend button is enabled.
    confirmation_sent_at: new Date(0).toISOString(),
  });
}

test.describe("Auth - Unconfirmed step", () => {
  test("navigates to unconfirmed step when API returns account_unconfirmed", async ({ page }) => {
    const email = randomEmail();
    await createUnconfirmedUser(email);

    await page.goto(routes.auth);

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill(email);
    await emailInput.press("Enter");

    await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Resend confirmation email" })).toBeVisible();
  });

  test("disables the resend button after a successful resend", async ({ page }) => {
    const email = randomEmail();
    await createUnconfirmedUser(email);

    await page.goto(routes.auth);

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill(email);
    await emailInput.press("Enter");

    const resendButton = page.getByRole("button", { name: "Resend confirmation email" });
    await expect(resendButton).toBeEnabled();
    await resendButton.click();
    await expect(resendButton).toBeDisabled();
  });

  test("allows navigating back to the email step", async ({ page }) => {
    const email = randomEmail();
    await createUnconfirmedUser(email);

    await page.goto(routes.auth);

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill(email);
    await emailInput.press("Enter");

    await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();

    await page.getByRole("button", { name: "Back", exact: true }).click();

    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue(email);
  });
});
