import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../config";

test.describe("Profile - authenticated user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.auth);

    const email = page.getByRole("textbox", { name: "Email" });
    await email.fill(userLogin.email);
    await email.press("Enter");

    const password = page.getByRole("textbox", { name: "Password" });
    await password.fill(userLogin.password);
    await password.press("Enter");

    await expect(page.getByTestId("signed.in.view")).toBeVisible();
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
    const originalFirstName = await firstNameField.inputValue();

    try {
      await firstNameField.fill("UpdatedFirstName");

      const submitButton = page.getByRole("button", { name: "Submit" });
      await submitButton.click();

      await page.waitForTimeout(2000);
      await page.reload();
      await expect(firstNameField).toHaveValue("UpdatedFirstName");
    } finally {
      await firstNameField.fill(originalFirstName);
      await page.getByRole("button", { name: "Submit" }).click();
      await page.waitForTimeout(2000);
    }
  });

  test("shows date_of_birth error after submit (future date)", async ({ page }) => {
    const invalidDOB = new Date(Date.now() + 86400000).toLocaleDateString("sv-SE");
    const dob = page.locator("input[type='date']");
    const originalDOB = await dob.inputValue();

    try {
      await dob.fill(invalidDOB);
      await dob.blur();

      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page.locator("#date_of_birth-error")).toContainText(/has to be in the past/i);
    } finally {
      await dob.fill(originalDOB);
      await page.getByRole("button", { name: "Submit" }).click();
    }
  });

  test("logout works correctly", async ({ page }) => {
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
