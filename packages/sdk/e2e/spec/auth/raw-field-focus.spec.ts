import { routes } from "../../config";
import { expect, test } from "../../fixtures";

async function startRegistrationFlow(page: import("@playwright/test").Page, email: string) {
  await page.goto(routes.auth);
  await page.getByRole("textbox", { name: /e-?mail/i }).fill(email);
  await page
    .getByRole("button", { name: /continue|submit|next/i })
    .first()
    .click();
  await expect(page.getByRole("textbox", { name: /e-?mail/i })).not.toBeVisible({ timeout: 10000 });
}

async function submitEmailAndVerify(page: import("@playwright/test").Page, email: string) {
  // Wait for verification step
  await expect(page.getByRole("textbox", { name: /code/i })).toBeVisible({ timeout: 10000 });

  // Fetch the verification code from the API
  const codeResponse = await page.request.get(
    `http://localhost:3000/api/sdk/test/last_confirmation_code?email=${encodeURIComponent(email)}`,
  );
  const { code } = await codeResponse.json();

  await page.getByRole("textbox", { name: /code/i }).fill(code);
  await page
    .getByRole("button", { name: /continue|submit|verify/i })
    .first()
    .click();
}

async function navigateToPasswordStep(page: import("@playwright/test").Page, email: string) {
  await startRegistrationFlow(page, email);
  await submitEmailAndVerify(page, email);

  await page.getByRole("textbox", { name: "First Name" }).fill("Test");
  await page
    .getByRole("button", { name: /continue|submit|next/i })
    .first()
    .click();

  await expect(page.getByRole("heading", { name: "Create a password" })).toBeVisible({ timeout: 10000 });
}

test.describe("u-raw-field focus behaviour", () => {
  test("focuses the field when an error is first set", async ({ page }) => {
    const email = `raw-field-focus-${Date.now()}@example.com`;
    await navigateToPasswordStep(page, email);

    await page.locator("u-raw-field[field='password'] input").fill("short");
    await page
      .getByRole("button", { name: /continue|submit|next/i })
      .first()
      .click();

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();

    const focused = await page.evaluate(() => document.activeElement?.closest("u-raw-field")?.getAttribute("field"));
    expect(focused).toBe("password");
  });

  test("does not re-steal focus when the same error is reasserted during a re-render", async ({ page }) => {
    const email = `raw-field-no-refocus-${Date.now()}@example.com`;
    await navigateToPasswordStep(page, email);

    // Trigger an error on the password field
    await page.locator("u-raw-field[field='password'] input").fill("short");
    await page
      .getByRole("button", { name: /continue|submit|next/i })
      .first()
      .click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();

    // Move focus to the password_confirmation field
    const confirmInput = page.locator("u-raw-field[field='password_confirmation'] input");
    await confirmInput.click();
    await expect(confirmInput).toBeFocused();

    // Typing in the confirmation field updates registrationState, causing all raw-fields
    // (including the password field with the existing error) to re-render.
    // Without the fix, the password field would steal focus back here.
    await confirmInput.type("a");

    // Focus must remain on the confirmation field
    await expect(confirmInput).toBeFocused();
  });
});
