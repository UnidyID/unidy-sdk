import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { routes } from "../../config";

// TODO: refactor (https://playwright.dev/docs/auth#session-storage)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const session = JSON.parse(readFileSync(path.resolve(__dirname, "../../../playwright/.auth/session.json"), "utf-8"));

test.describe("Profile - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript((data) => {
      for (const [key, value] of Object.entries(data)) {
        sessionStorage.setItem(key, String(value));
      }
    }, session);
    await page.goto(routes.profile);
  });

  test("profile page loads successfully", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
    await expect(page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("profile updated successfully", async ({ page }) => {
    const firstNameField = page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox");

    await firstNameField.fill("UpdatedFirstName");

    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.click();

    await page.reload();
    await expect(firstNameField).toHaveValue("UpdatedFirstName");
  });

  test("shows date_of_birth error after submit (future date)", async ({ page }) => {
    const invalidDOB = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dob = page.locator("input[type='date']");

    await dob.fill(invalidDOB);
    await dob.blur();

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.locator("#date_of_birth-error")).toContainText(/has to be in the past/i);
  });

  test("logout works correctly", async ({ page }) => {
    const logoutButton = page.getByRole("button", { name: "Logout" });
    await logoutButton.click();

    await expect(page.getByText("You need to sign in to view your profile")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
