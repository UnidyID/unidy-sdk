import { routes } from "../../config";
import { expect, test } from "../../fixtures";
import { type ProfilePatch, stubProfile } from "./helpers";

test.describe("Profile - authenticated user", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let patches: ProfilePatch[];

  test.beforeEach(async ({ page }) => {
    patches = await stubProfile(page);
  });

  test("profile page loads successfully", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);
    await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
    await expect(page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("renders the values from /me with the metadata from /me/profile_fields", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    await page.goto(routes.profile);

    await expect(page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox")).toHaveValue("Max");
    await expect(page.locator("input[type='date']")).toHaveValue("1990-04-01");
    await expect(page.locator("u-field").filter({ hasText: "Favorite Nut" }).locator("select")).toHaveValue("peanut");
    await expect(page.getByRole("checkbox", { name: "Football" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Tennis" })).not.toBeChecked();
  });

  test("profile updated successfully", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    // Disable autosave so manual submit works without interference
    await page.locator("#autosave-toggle").uncheck();

    const firstNameField = page.locator("u-field").filter({ hasText: "First name" }).getByRole("textbox");

    const firstName = `Updated${Date.now()}`;
    await firstNameField.fill(firstName);

    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.click();

    await expect(page.getByText("Profile is updated")).toBeVisible();

    // The whole form is sent, without the read-only email and without partial validation
    const { payload } = patches[0];
    expect(payload.validate_only_sent_fields).toBeUndefined();
    expect(payload.data).toMatchObject({ first_name: firstName, last_name: "Muster", date_of_birth: "1990-04-01", phone_number: null });
    expect(payload.data).not.toHaveProperty("email");
    expect(payload.data.custom_attributes).toEqual({ favorite_nut: "peanut", sports_interests: ["football"], newsletter_ok: null });
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

    // Server-side validation returns a date_of_birth error, named by its body path
    await expect(page.locator("#date_of_birth-error")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#date_of_birth-error")).toContainText("Date of birth must be in the past");
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
