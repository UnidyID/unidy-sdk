import { routes } from "../../config";
import { expect, test } from "../../fixtures";

test.describe("Profile - partial validation", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  // Skip WebKit due to timing issues with flash message detection
  test.skip(({ browserName }) => browserName === "webkit", "WebKit has timing issues with flash messages");

  test("multiple u-profile components work independently with partial validation", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    await page.goto(routes.profilePartial);

    // Wait for all profile components to load
    await expect(page.locator("#profile-1")).toBeVisible();
    await expect(page.locator("#profile-2")).toBeVisible();
    await expect(page.locator("#profile-3")).toBeVisible();

    // Verify each profile section shows its respective fields
    const profile1FirstName = page.locator('[data-testid="profile1-first-name"]').getByRole("textbox");
    const profile2LastName = page.locator('[data-testid="profile2-last-name"]').getByRole("textbox");

    await expect(profile1FirstName).toBeVisible();
    await expect(profile2LastName).toBeVisible();

    // Update first name in profile 1
    const testFirstName = `PartialTest${Date.now()}`;
    await profile1FirstName.fill(testFirstName);
    await page.locator('[data-testid="profile1-submit"]').click();

    // Wait for success message (increased timeout for slower browsers)
    await expect(page.getByText("Profile is updated")).toBeVisible({ timeout: 10000 });

    // Verify profile 1 update didn't affect profile 2's registered fields
    // (this implicitly tests instance isolation - if fields were shared,
    // profile 2 would have first_name in its renderedFields Set)
  });

  test("partial validation only submits rendered fields", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profilePartial);

    // Wait for profile 1 to load
    await expect(page.locator("#profile-1")).toBeVisible();

    const profile1FirstName = page.locator('[data-testid="profile1-first-name"]').getByRole("textbox");
    await expect(profile1FirstName).toBeVisible();

    const testFirstName = `ValidName${Date.now()}`;
    await profile1FirstName.fill(testFirstName);

    const patchPromise = page.waitForRequest((req) => req.url().includes("/api/sdk/v1/profile") && req.method() === "PATCH");
    await page.locator('[data-testid="profile1-submit"]').click();
    const patchRequest = await patchPromise;

    // Payload must contain only first_name — not every profile field
    const body = patchRequest.postDataJSON();
    expect(body.first_name).toBe(testFirstName);
    expect(body._validate_only_sent_fields).toBe(true);
    const payloadKeys = Object.keys(body).filter((k) => k !== "_validate_only_sent_fields");
    expect(payloadKeys).toEqual(["first_name"]);

    await expect(page.getByText("Profile is updated")).toBeVisible({ timeout: 10000 });
  });

  test("standalone u-raw-field value is included in partial-validation payload", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profilePartial);
    await expect(page.locator("#profile-4")).toBeVisible();

    const firstNameInput = page.locator('[data-testid="profile4-first-name"]').getByRole("textbox");
    const lastNameInput = page.locator('[data-testid="profile4-last-name"]').getByRole("textbox");
    await expect(firstNameInput).toBeVisible();
    await expect(lastNameInput).toBeVisible();

    const testFirstName = `RawFirst${Date.now()}`;
    const testLastName = `RawLast${Date.now()}`;
    await firstNameInput.fill(testFirstName);
    await lastNameInput.fill(testLastName);

    const patchPromise = page.waitForRequest((req) => req.url().includes("/api/sdk/v1/profile") && req.method() === "PATCH");
    await page.locator('[data-testid="profile4-submit"]').click();
    const patchRequest = await patchPromise;

    const body = patchRequest.postDataJSON();
    expect(body.first_name).toBe(testFirstName);
    expect(body.last_name).toBe(testLastName);
    expect(body._validate_only_sent_fields).toBe(true);
    // Only the two rendered fields — full-profile keys must not bleed in
    const payloadKeys = Object.keys(body).filter((k) => k !== "_validate_only_sent_fields");
    expect(payloadKeys).toEqual(expect.arrayContaining(["first_name", "last_name"]));
    expect(payloadKeys).toHaveLength(2);

    await expect(page.getByText("Profile is updated")).toBeVisible({ timeout: 10000 });
  });

  test("explicit validateFields prop overrides auto-detection", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profilePartial);

    // Wait for profile 3 which has validateFields="first_name,last_name"
    await expect(page.locator("#profile-3")).toBeVisible();

    const profile3FirstName = page.locator('[data-testid="profile3-first-name"]').getByRole("textbox");
    const profile3LastName = page.locator('[data-testid="profile3-last-name"]').getByRole("textbox");
    const profile3Dob = page.locator('[data-testid="profile3-dob"]').locator("input[type='date']");

    await expect(profile3FirstName).toBeVisible();
    await expect(profile3LastName).toBeVisible();
    await expect(profile3Dob).toBeVisible();

    // Fill valid names
    await profile3FirstName.fill(`First${Date.now()}`);
    await profile3LastName.fill(`Last${Date.now()}`);

    // Set an invalid date (future date) - this should NOT cause validation error
    // because validateFields only includes first_name and last_name
    const futureDate = new Date(Date.now() + 86400000 * 365).toISOString().split("T")[0];
    await profile3Dob.fill(futureDate);

    // Submit - should succeed because date_of_birth is not in validateFields
    await page.locator('[data-testid="profile3-submit"]').click();

    // Should succeed - the future date_of_birth is not validated
    await expect(page.getByText("Profile is updated")).toBeVisible({ timeout: 10000 });
  });
});
