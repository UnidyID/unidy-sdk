import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { routes } from "../../../config";
import { ModelCountAssert } from "../../../lib/assert/count";
import { randomEmail } from "../../../lib/helpers/random";

/**
 * Mock the internal matching /config endpoint to report the feature as enabled.
 * Must be called before navigating so the route interceptor is in place when the
 * component mounts and fetches its configuration.
 */
async function mockInternalMatchingEnabled(page: Page) {
  await page.route(/\/api\/sdk\/v1\/registration\/internal_matching\/config/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        enabled: true,
        matching_attribute: { name: "customer_id", label: "Customer Number", format: "text" },
        additional_fields: [
          { name: "last_name", label: "Last Name", format: "text" },
          { name: "date_of_birth", label: "Date of Birth", format: "date" },
        ],
      }),
    }),
  );
}

/**
 * Navigate through email → password to reach the internal-matching step.
 * Email verification is intentionally omitted; Devise sends a confirmation
 * email to the user after finalization instead.
 */
async function navigateToInternalMatchingStep(page: import("@playwright/test").Page, email: string) {
  await page.goto(routes.internalMatching);

  // Trigger registration via the sign-in root. Scope the Continue button to the
  // sign-in email step to avoid matching the registration email step's button,
  // and wait for it to be enabled (u-submit-button starts disabled during initial auth check).
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  const signInContinue = page.locator("u-signin-step[name='email'] button[type='submit']");
  await expect(signInContinue).toBeEnabled({ timeout: 10000 });
  await signInContinue.click();

  // Wait for the registration section to appear
  await expect(page.getByRole("heading", { name: "Create a new account" })).toBeVisible({ timeout: 10000 });

  // Step 1 (registration email step): email is pre-filled from store; just submit
  await page.locator("u-registration-step[name='email'] button[type='submit']").first().click();

  // Step 2: password
  await expect(page.getByText("Create a password")).toBeVisible({ timeout: 10000 });
  await page.locator("u-raw-field[field='password'] input").fill("Test1234!");
  await page.locator("u-raw-field[field='password_confirmation'] input").fill("Test1234!");
  await page.locator("u-registration-step[name='password'] button[type='submit']").first().click();

  // Now on internal-matching step (element is in the DOM; visibility depends on auto-skip config)
  await expect(page.locator("u-registration-step[name='internal-matching']")).toBeAttached();
}

test.describe("Registration — internal matching step", () => {
  test("component is mounted on the internal-matching step", async ({ page }) => {
    const email = randomEmail();

    await mockInternalMatchingEnabled(page);
    await navigateToInternalMatchingStep(page, email);

    const component = page.locator("u-registration-internal-matching");
    await expect(component).toBeAttached();
  });

  test("full registration completes when internal matching is disabled (auto-skip)", async ({ page }) => {
    const email = randomEmail();
    const userCount = await ModelCountAssert.init("User", { scope: { email } });

    // Mock config as disabled so the component deterministically auto-skips.
    await page.route(/\/api\/sdk\/v1\/registration\/internal_matching\/config/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ enabled: false }),
      }),
    );

    const registrationCompletePromise = page.waitForEvent("console", {
      predicate: (msg) => msg.text().includes("Registration complete:"),
      timeout: 30000,
    });

    await navigateToInternalMatchingStep(page, email);

    const completeLog = await registrationCompletePromise;
    expect(completeLog.text()).toContain("Registration complete:");
    await userCount.toHaveChangedBy(1);
  });

  test("skip button completes registration when internal matching is enabled", async ({ page }) => {
    const email = randomEmail();

    // Mock /config so the form renders without needing the feature on the server.
    // Also mock /skip — the component then calls finalizeRegistration() against the
    // real server using the actual rid, so the user is genuinely created.
    await mockInternalMatchingEnabled(page);
    await page.route(/\/api\/sdk\/v1\/registration\/internal_matching\/skip/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rid: "mocked",
          status: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
          expired: false,
          can_finalize: true,
          email_verified: false,
          email: null,
          newsletter_preferences: null,
          registration_profile_data: null,
          social_provider: null,
          has_passkey: null,
          has_password: null,
        }),
      }),
    );

    await navigateToInternalMatchingStep(page, email);

    // Set up the listener right before the action so the navigation time doesn't
    // eat into the event timeout.
    const registrationCompletePromise = page.waitForEvent("console", {
      predicate: (msg) => msg.text().includes("Registration complete:"),
      timeout: 30000,
    });

    await page.getByRole("button", { name: /continue without linking/i }).click();

    const completeLog = await registrationCompletePromise;
    expect(completeLog.text()).toContain("Registration complete:");
  });

  test("match found → confirm link completes registration", async ({ page }) => {
    const email = randomEmail();

    await mockInternalMatchingEnabled(page);

    // Mock /check to return a found match.
    await page.route(/\/api\/sdk\/v1\/registration\/internal_matching\/check/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          matching_status: "found",
          matching_user_id: 42,
          matched_user_preview: { email_masked: "j***@example.com", created_at: "2023-06-15T10:00:00.000Z" },
        }),
      }),
    );

    // Mock /confirm — returns RegistrationFlowResponse with can_finalize: true so
    // finalizeRegistration() runs against the real server with the actual rid.
    await page.route(/\/api\/sdk\/v1\/registration\/internal_matching\/confirm/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rid: "mocked",
          status: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
          expired: false,
          can_finalize: true,
          email_verified: false,
          email: null,
          newsletter_preferences: null,
          registration_profile_data: null,
          social_provider: null,
          has_passkey: null,
          has_password: null,
        }),
      }),
    );

    await navigateToInternalMatchingStep(page, email);

    // Fill in all matching fields and submit.
    await page.locator("u-registration-internal-matching input#u-im-primary-field").fill("CUST-12345");
    await page.locator("u-registration-internal-matching input#u-im-field-last_name").fill("Smith");
    await page.locator("u-registration-internal-matching input#u-im-field-date_of_birth").fill("1990-03-15");
    await page.getByRole("button", { name: /find account/i }).click();

    // Match-found card should appear.
    await expect(page.getByText(/account found/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("j***@example.com")).toBeVisible();

    const registrationCompletePromise = page.waitForEvent("console", {
      predicate: (msg) => msg.text().includes("Registration complete:"),
      timeout: 30000,
    });

    await page.getByRole("button", { name: /yes, use this account/i }).click();

    const completeLog = await registrationCompletePromise;
    expect(completeLog.text()).toContain("Registration complete:");
  });

  test("generic error is shown when config fetch fails", async ({ page }) => {
    const email = randomEmail();

    await page.route(/\/api\/sdk\/v1\/registration\/internal_matching\/config/, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );

    await navigateToInternalMatchingStep(page, email);

    await expect(page.locator("u-registration-internal-matching").getByRole("alert")).toBeVisible({ timeout: 5000 });
  });

  test("no-match error is shown when customer number is not found", async ({ page }) => {
    const email = randomEmail();

    // Mock /config so the form renders, and /check to always return not-found.
    await mockInternalMatchingEnabled(page);
    await page.route(/\/api\/sdk\/v1\/registration\/internal_matching\/check/, (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error_identifier: "internal_matching_match_not_found" }),
      }),
    );

    await navigateToInternalMatchingStep(page, email);

    await page.locator("u-registration-internal-matching input#u-im-primary-field").fill("INVALID-99999");
    await page.locator("u-registration-internal-matching input#u-im-field-last_name").fill("Doe");
    await page.locator("u-registration-internal-matching input#u-im-field-date_of_birth").fill("1985-01-01");
    await page.getByRole("button", { name: /find account/i }).click();

    await expect(page.getByText(/no matching account found/i)).toBeVisible({ timeout: 5000 });
  });
});
