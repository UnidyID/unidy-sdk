import { routes } from "../../config";
import { expect, test } from "../../fixtures";

test.describe("Profile - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("profile page loads successfully", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);
    await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
    await expect(page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("profile updated successfully", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    // Disable autosave so manual submit works without interference
    await page.locator("#autosave-toggle").uncheck();

    const firstNameField = page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox");

    await firstNameField.fill(`Updated${Date.now()}`);

    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.click();

    await expect(page.getByText("Profile is updated")).toBeVisible();
  });

  test("shows date_of_birth error after submit (future date)", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    // Disable autosave so manual submit works without interference
    await page.locator("#autosave-toggle").uncheck();

    const invalidDOB = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dob = page.locator("input[type='date']");

    await dob.fill(invalidDOB);

    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.click();

    // Server-side validation returns a date_of_birth error
    await expect(page.locator("#date_of_birth-error")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Profile - unauthenticated user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.profile);
  });

  test("profile page shows signed out state", async ({ page }) => {
    await page.goto(routes.profile);
    await expect(page.getByText("You need to sign in to view your profile")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
