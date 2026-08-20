import { routes } from "../../config";
import { expect, test } from "../../fixtures";
import { EmailAssert } from "../../lib/assert/emails";
import { randomEmail } from "../../lib/helpers/random";

async function startRegistrationFlow(page: import("@playwright/test").Page, email: string) {
  await page.goto(routes.auth);
  const emailInput = page.getByRole("textbox", { name: "Email" });
  await emailInput.fill(email);
  await emailInput.press("Enter");
  await expect(page.getByRole("heading", { name: "Create a new account" })).toBeVisible();
}

async function submitEmailAndVerify(page: import("@playwright/test").Page, email: string) {
  const emailAssert = await EmailAssert.init({ to: email });

  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page.getByText("Verify your email")).toBeVisible();
  await emailAssert.toHaveReceived(1);

  const lastEmail = await emailAssert.ensureLast();
  const codeMatch = lastEmail.body.match(/(\d{4})/);
  expect(codeMatch).not.toBeNull();
  const code = codeMatch?.[1];

  const inputs = page.locator("u-registration-email-verification input");
  for (let i = 0; i < 4; i++) {
    await inputs.nth(i).fill(code[i]);
  }

  await expect(page.getByRole("textbox", { name: "First Name" })).toBeVisible({ timeout: 10000 });
}

async function navigateToPasswordStep(page: import("@playwright/test").Page, email: string) {
  await startRegistrationFlow(page, email);
  await submitEmailAndVerify(page, email);

  await page.getByRole("textbox", { name: "First Name" }).fill("Test");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Create a password" })).toBeVisible({ timeout: 10000 });
}

test.describe("u-raw-field focus behaviour", () => {
  test("focuses the field when an error is first set", async ({ page }) => {
    const email = randomEmail();
    await navigateToPasswordStep(page, email);

    await page.locator("u-raw-field[field='password'] input").fill("short");
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();

    const focused = await page.evaluate(() => document.activeElement?.closest("u-raw-field")?.getAttribute("field"));
    expect(focused).toBe("password");
  });

  test("does not re-steal focus when the same error is reasserted during a re-render", async ({ page }) => {
    const email = randomEmail();
    await navigateToPasswordStep(page, email);

    await page.locator("u-raw-field[field='password'] input").fill("short");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();

    const confirmInput = page.locator("u-raw-field[field='password_confirmation'] input");
    await confirmInput.click();
    await expect(confirmInput).toBeFocused();

    await confirmInput.type("a");

    await expect(confirmInput).toBeFocused();
  });
});
