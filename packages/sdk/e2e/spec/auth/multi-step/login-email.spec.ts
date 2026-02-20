import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../../config";

test.describe("Auth - Email step", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.auth);
  });

  test("should show email input and disabled continue button initially", async ({ page }) => {
    const email = page.getByRole("textbox", { name: "Email" });
    const continueBtn = page.getByRole("button", { name: "Continue", exact: true });

    await expect(email).toBeVisible();
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toBeDisabled();
  });

  // TODO: No email format validation right now.
  // Any non-empty input enables the Continue button

  test("should proceed to password step for existing email", async ({ page }) => {
    const email = page.getByRole("textbox", { name: "Email" });

    await email.fill(userLogin.email);
    await email.press("Enter");

    const password = page.getByRole("textbox", { name: "Password" });
    await expect(password).toBeVisible();
  });

  test("should start registration flow when email is not found", async ({ page }) => {
    const email = page.getByRole("textbox", { name: "Email" });

    await email.fill("doesnotexist@example.com");
    await email.press("Enter");

    // Registration flow should start automatically
    await expect(page.getByRole("heading", { name: "Create a new account" })).toBeVisible();
  });
});
