import { routes } from "../../config";
import { expect, test } from "../../fixtures";

test.describe("Profile - autosave on blur", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("saves profile automatically when field loses focus", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    const firstNameField = page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox");
    await expect(firstNameField).toBeVisible();

    const testName = `AutoSave${Date.now()}`;
    await firstNameField.fill(testName);

    // Blur the field by clicking elsewhere to trigger save-on-blur
    await page.locator("u-field").filter({ hasText: "Last name" }).getByRole("textbox").click();

    // Should show success flash message
    await expect(page.getByText("Profile is updated")).toBeVisible({ timeout: 10000 });

    // Verify the value persisted after reload
    await page.reload();
    await expect(firstNameField).toHaveValue(testName);
  });

  test("shows save indicator on the field being saved", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    const firstNameField = page.locator("u-field").filter({ hasText: "First name" });
    const textbox = firstNameField.getByRole("textbox");
    await expect(textbox).toBeVisible();

    await textbox.fill(`Indicator${Date.now()}`);

    // Blur to trigger save
    await page.locator("u-field").filter({ hasText: "Last name" }).getByRole("textbox").click();

    // The saved checkmark should appear after successful save
    const savedIndicator = firstNameField.locator("[part~='field-save-indicator--saved']");
    await expect(savedIndicator).toBeVisible({ timeout: 10000 });

    // Checkmark should disappear after ~2 seconds
    await expect(savedIndicator).toBeHidden({ timeout: 5000 });
  });

  test("does not autosave when there are no changes", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    const firstNameField = page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox");
    await expect(firstNameField).toBeVisible();

    // Focus and blur without changing the value
    await firstNameField.click();
    await page.locator("u-field").filter({ hasText: "Last name" }).getByRole("textbox").click();

    // Should not show success message since nothing changed
    await expect(page.getByText("Profile is updated")).toBeHidden({ timeout: 3000 });
  });

  test("does not autosave when field has validation error", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    const dobField = page.locator("input[type='date']");
    await expect(dobField).toBeVisible();

    // Set a future date (invalid)
    const futureDate = new Date(Date.now() + 86400000 * 365).toISOString().split("T")[0];
    await dobField.fill(futureDate);
    await dobField.blur();

    // Should not show success message due to validation error
    await expect(page.getByText("Profile is updated")).toBeHidden({ timeout: 3000 });
  });

  test("submit button is disabled when no changes are made", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test("submit button becomes enabled after making changes", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled();

    const firstNameField = page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox");
    await firstNameField.fill(`Changed${Date.now()}`);

    await expect(submitButton).toBeEnabled();
  });

  test("Enter key triggers immediate field save", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    const firstNameField = page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox");
    await expect(firstNameField).toBeVisible();

    const testName = `EnterSave${Date.now()}`;
    await firstNameField.fill(testName);
    await firstNameField.press("Enter");

    await expect(page.getByText("Profile is updated")).toBeVisible({ timeout: 10000 });
  });

  test("disabling autosave prevents save on blur", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    // Disable autosave via the toggle
    const autosaveToggle = page.locator("#autosave-toggle");
    await autosaveToggle.uncheck();

    const firstNameField = page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox");
    await firstNameField.fill(`NoAutoSave${Date.now()}`);

    // Blur the field
    await page.locator("u-field").filter({ hasText: "Last name" }).getByRole("textbox").click();

    // Should not auto-save
    await expect(page.getByText("Profile is updated")).toBeHidden({ timeout: 3000 });

    // But manual submit should still work
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Profile is updated")).toBeVisible({ timeout: 10000 });
  });
});
