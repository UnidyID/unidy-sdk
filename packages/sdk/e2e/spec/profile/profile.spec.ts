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
    const firstNameField = page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox");

    await firstNameField.fill("UpdatedFirstName");

    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.click();

    await expect(page.getByText("Profile is updated")).toBeVisible();

    await page.reload();
    await expect(firstNameField).toHaveValue("UpdatedFirstName");
  });

  test("shows date_of_birth error after submit (future date)", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);
    const invalidDOB = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dob = page.locator("input[type='date']");

    await dob.fill(invalidDOB);
    await dob.blur();

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.locator("#date_of_birth-error")).toContainText(/has to be in the past/i);
  });

  test("logout works correctly", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);
    const logoutButton = page.getByRole("button", { name: "Logout" });
    await logoutButton.click();

    await expect(page.getByText("You need to sign in to view your profile")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});

test.describe("Profile - unauthenticated user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.profile);
  });

  test("profile page shows signed out state", async ({ page }) => {
    await page.goto(routes.profile);
    await expect(page.getByText("You need to sign in to view")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
