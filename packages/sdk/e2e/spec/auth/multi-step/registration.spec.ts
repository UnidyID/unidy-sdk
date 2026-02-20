import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../../config";
import { ModelCountAssert } from "../../../lib/assert/count";
import { EmailAssert } from "../../../lib/assert/emails";
import { randomEmail } from "../../../lib/helpers/random";

/**
 * Helper: enter a fresh email in the signin flow to trigger the registration step.
 */
async function startRegistrationFlow(page: import("@playwright/test").Page, email: string) {
  await page.goto(routes.auth);

  const emailInput = page.getByRole("textbox", { name: "Email" });
  await emailInput.fill(email);
  await emailInput.press("Enter");

  // Wait for the registration heading to appear
  await expect(page.getByRole("heading", { name: "Create a new account" })).toBeVisible();
}

/** Click the Continue submit button (exact match to avoid social login buttons). */
async function clickContinue(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

/**
 * Submit the email step and handle the verification step.
 * Initializes EmailAssert before the step transition so the email count baseline is correct.
 */
async function submitEmailAndVerify(page: import("@playwright/test").Page, email: string) {
  const emailAssert = await EmailAssert.init({ to: email });

  await clickContinue(page);

  // Wait for verification step heading
  await expect(page.getByText("Verify your email")).toBeVisible();

  // Wait for the verification email to arrive
  await emailAssert.toHaveReceived(1);

  // Extract the 4-digit code from the email body
  const lastEmail = await emailAssert.ensureLast();
  const codeMatch = lastEmail.body.match(/(\d{4})/);
  expect(codeMatch).not.toBeNull();
  const code = codeMatch?.[1];

  // Enter the code into the 4 digit inputs
  const inputs = page.locator("u-registration-email-verification input");
  for (let i = 0; i < 4; i++) {
    await inputs.nth(i).fill(code[i]);
  }

  // Wait for auto-verification and step transition (profile step should appear)
  await expect(page.getByRole("textbox", { name: "First Name" })).toBeVisible({ timeout: 10000 });
}

/**
 * Navigate through email → verification → profile → password to reach the newsletters step.
 */
async function navigateToNewslettersStep(page: import("@playwright/test").Page, email: string) {
  await startRegistrationFlow(page, email);

  // Step 1 + 2: Email → Verification
  await submitEmailAndVerify(page, email);

  // Step 3: Profile — fill required fields and submit
  await page.getByRole("textbox", { name: "First Name" }).fill("Test");
  await clickContinue(page);

  // Step 4: Password
  await expect(page.getByRole("heading", { name: "Create a password" })).toBeVisible();
  await page.locator("u-raw-field[field='password'] input").fill("Test1234!");
  await clickContinue(page);

  // Step 5: Passkey — skip it
  await expect(page.getByRole("heading", { name: "Add a passkey" })).toBeVisible();
  await clickContinue(page);

  // Should be on newsletters step
  await expect(page.getByRole("heading", { name: "Newsletter preferences" })).toBeVisible();
}

/** Navigate through email → verification → profile → password to reach the passkey step. */
async function navigateToPasskeyStep(page: import("@playwright/test").Page, email: string) {
  await startRegistrationFlow(page, email);

  // Step 1 + 2: Email → Verification
  await submitEmailAndVerify(page, email);

  // Step 3: Profile — fill required fields and submit
  await page.getByRole("textbox", { name: "First Name" }).fill("Test");
  await clickContinue(page);

  // Step 4: Password
  await expect(page.getByRole("heading", { name: "Create a password" })).toBeVisible();
  await page.locator("u-raw-field[field='password'] input").fill("Test1234!");
  await clickContinue(page);

  // Should be on passkey step
  await expect(page.getByRole("heading", { name: "Add a passkey" })).toBeVisible();
}

/** Navigate through email → verification → profile to reach the password step. */
async function navigateToPasswordStep(page: import("@playwright/test").Page, email: string) {
  await startRegistrationFlow(page, email);

  // Step 1 + 2: Email → Verification
  await submitEmailAndVerify(page, email);

  // Step 3: Profile — fill required fields and submit
  await page.getByRole("textbox", { name: "First Name" }).fill("Test");
  await clickContinue(page);

  // Should be on password step
  await expect(page.getByRole("heading", { name: "Create a password" })).toBeVisible();
}

test.describe("Registration - full flow", () => {
  test("should complete the full registration flow and create a user", async ({ page }) => {
    const email = randomEmail();
    const userCount = await ModelCountAssert.init("User", { scope: { email } });

    // Listen for the registrationComplete event from the start
    const registrationCompletePromise = page.waitForEvent("console", {
      predicate: (msg) => msg.text().includes("Registration complete:"),
      timeout: 30000,
    });

    // Step 1 + 2: Email → Verification
    await startRegistrationFlow(page, email);
    await submitEmailAndVerify(page, email);

    // Step 3: Profile
    await page.getByRole("textbox", { name: "First Name" }).fill("Test");
    await page.getByRole("textbox", { name: "Last Name" }).fill("User");
    await page.getByRole("combobox").selectOption("blue");
    await clickContinue(page);

    // Step 4: Password
    await expect(page.getByRole("heading", { name: "Create a password" })).toBeVisible();
    await page.locator("u-raw-field[field='password'] input").fill("Test1234!");
    await clickContinue(page);

    // Step 5: Passkey — skip it
    await expect(page.getByRole("heading", { name: "Add a passkey" })).toBeVisible();
    await clickContinue(page);

    // Step 6: Newsletters
    await expect(page.getByRole("heading", { name: "Newsletter preferences" })).toBeVisible();
    await page.getByRole("button", { name: "Complete Registration" }).click();

    // The registrationComplete event should fire (demo page logs it to console)
    const completeLog = await registrationCompletePromise;
    expect(completeLog.text()).toContain("Registration complete:");

    // Verify a user record was created in the database
    await userCount.toHaveChangedBy(1);
  });

  test("should show validation error for required first name on profile step", async ({ page }) => {
    const email = randomEmail();

    await startRegistrationFlow(page, email);

    // Submit email step and verify
    await submitEmailAndVerify(page, email);

    // Step 3: Profile — submit without filling required first name
    await expect(page.getByRole("textbox", { name: "First Name" })).toBeVisible();
    await clickContinue(page);

    // Should stay on profile step (first_name is required via HTML required attribute)
    await expect(page.getByRole("textbox", { name: "First Name" })).toBeVisible();
  });

  test("should show client-side password validation error", async ({ page }) => {
    const email = randomEmail();

    await navigateToPasswordStep(page, email);

    // Enter a short password that fails client-side pattern
    await page.locator("u-raw-field[field='password'] input").fill("short");
    await clickContinue(page);

    // Should show the client-side pattern error and stay on password step
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create a password" })).toBeVisible();
  });

  test("should navigate back between registration steps", async ({ page }) => {
    const email = randomEmail();

    await navigateToPasswordStep(page, email);

    // Go back from password step to profile step
    await page.getByRole("button", { name: "Back", exact: true }).click();

    // Should be back on profile step with the first name preserved
    await expect(page.getByRole("textbox", { name: "First Name" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "First Name" })).toHaveValue("Test");
  });
});

test.describe("Registration - email verification", () => {
  test("should verify email with code and advance to profile step", async ({ page }) => {
    const email = randomEmail();

    await startRegistrationFlow(page, email);

    // Init EmailAssert before submitting (so baseline count is captured before the email is sent)
    const emailAssert = await EmailAssert.init({ to: email });

    await clickContinue(page);

    // Verification step should appear
    await expect(page.getByText("Verify your email")).toBeVisible();

    // Verification code inputs should be visible
    const inputs = page.locator("u-registration-email-verification input");
    await expect(inputs.first()).toBeVisible();

    // Wait for the verification email and extract the code
    await emailAssert.toHaveReceived(1);

    const lastEmail = await emailAssert.ensureLast();
    const codeMatch = lastEmail.body.match(/(\d{4})/);
    expect(codeMatch).not.toBeNull();
    const code = codeMatch?.[1];

    // Enter the code digit by digit
    for (let i = 0; i < 4; i++) {
      await inputs.nth(i).fill(code[i]);
    }

    // Should auto-verify and advance to the profile step
    await expect(page.getByRole("textbox", { name: "First Name" })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Registration - newsletters", () => {
  test("should toggle newsletter checkboxes", async ({ page }) => {
    const email = randomEmail();
    const userCount = await ModelCountAssert.init("User", { scope: { email } });

    const registrationCompletePromise = page.waitForEvent("console", {
      predicate: (msg) => msg.text().includes("Registration complete:"),
      timeout: 30000,
    });

    await navigateToNewslettersStep(page, email);

    // product_updates should be initially checked (has `checked` attribute in demo HTML)
    const productUpdates = page.locator("u-registration-newsletter[name='product_updates'] input[type='checkbox']");
    await expect(productUpdates).toBeChecked();

    // weekly_digest should initially be unchecked
    const weeklyDigest = page.locator("u-registration-newsletter[name='weekly_digest'] input[type='checkbox']");
    await expect(weeklyDigest).not.toBeChecked();

    // Toggle: uncheck product_updates, check weekly_digest
    await productUpdates.uncheck();
    await weeklyDigest.check();

    await expect(productUpdates).not.toBeChecked();
    await expect(weeklyDigest).toBeChecked();

    // Complete registration
    await page.getByRole("button", { name: "Complete Registration" }).click();

    const completeLog = await registrationCompletePromise;
    expect(completeLog.text()).toContain("Registration complete:");

    await userCount.toHaveChangedBy(1);
  });

  test("should select newsletter preferences (sub-preferences)", async ({ page }) => {
    const email = randomEmail();
    const userCount = await ModelCountAssert.init("User", { scope: { email } });

    const registrationCompletePromise = page.waitForEvent("console", {
      predicate: (msg) => msg.text().includes("Registration complete:"),
      timeout: 30000,
    });

    await navigateToNewslettersStep(page, email);

    // Check football and tennis sports_news preferences
    const football = page.locator("u-registration-newsletter-preference[preference='football'] input[type='checkbox']");
    const tennis = page.locator("u-registration-newsletter-preference[preference='tennis'] input[type='checkbox']");

    await football.check();
    await tennis.check();

    await expect(football).toBeChecked();
    await expect(tennis).toBeChecked();

    // Basketball should remain unchecked
    const basketball = page.locator("u-registration-newsletter-preference[preference='basketball'] input[type='checkbox']");
    await expect(basketball).not.toBeChecked();

    // Complete registration
    await page.getByRole("button", { name: "Complete Registration" }).click();

    const completeLog = await registrationCompletePromise;
    expect(completeLog.text()).toContain("Registration complete:");

    await userCount.toHaveChangedBy(1);
  });
});

test.describe("Registration - resume link", () => {
  test("should resume registration flow via email link and land on the correct step", async ({ page }) => {
    const email = randomEmail();

    // Start a registration flow, verify email, fill profile, then abandon
    await startRegistrationFlow(page, email);
    await submitEmailAndVerify(page, email);

    await page.getByRole("textbox", { name: "First Name" }).fill("Test");
    await clickContinue(page);

    // Should be on password step — abandon the flow here
    await expect(page.getByRole("heading", { name: "Create a password" })).toBeVisible();

    // Clear localStorage and reload to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.goto(routes.auth);
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible({ timeout: 10000 });

    // Start registration again with the same email — triggers registration_flow_already_exists
    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill(email);
    await emailInput.press("Enter");
    await expect(page.getByRole("heading", { name: "Create a new account" })).toBeVisible();
    await clickContinue(page);

    // The resume button should become visible
    const resumeButton = page.locator("u-registration-resume button");
    await expect(resumeButton).toBeVisible({ timeout: 5000 });

    // Track resume emails
    const resumeEmailAssert = await EmailAssert.init({ to: email });

    // Click the resume button to send the resume link email
    await resumeButton.click();
    await resumeEmailAssert.toHaveReceived(1);

    // Extract the resume link from the email
    const resumeEmail = await resumeEmailAssert.ensureLast();
    const linkMatch = resumeEmail.body.match(/href="(http[^"]*\/registration\/resume\/[^"]*)"/);
    expect(linkMatch).not.toBeNull();
    const resumeLink = linkMatch?.[1].replace(/&amp;/g, "&");

    // Navigate to the resume link
    await page.goto(resumeLink);

    // The flow should resume — email verified, so verification step is skipped.
    // Profile step shows with previously entered data preserved.
    await expect(page.getByRole("textbox", { name: "First Name" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("textbox", { name: "First Name" })).toHaveValue("Test");
  });
});

test.describe("Registration - passkey", () => {
  test("should register a passkey and show checkmark", async ({ page }) => {
    // Set up virtual authenticator via CDP
    const client = await page.context().newCDPSession(page);
    await client.send("WebAuthn.enable");
    await client.send("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });

    const email = randomEmail();
    await navigateToPasskeyStep(page, email);

    // Click the "Register Passkey" button
    const passkeyButton = page.locator("u-registration-passkey button");
    await expect(passkeyButton).toBeVisible();
    await passkeyButton.click();

    // The checkmark should appear after successful registration
    await expect(passkeyButton.locator("span")).toContainText("✓", { timeout: 10000 });

    // Continue to newsletters and complete registration
    await clickContinue(page);
    await expect(page.getByRole("heading", { name: "Newsletter preferences" })).toBeVisible();
  });
});

test.describe("Registration - known email redirect", () => {
  test("should redirect to signin verification for an already registered email", async ({ page }) => {
    await page.goto(routes.auth);

    // Enter the pre-existing test user email
    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill(userLogin.email);
    await emailInput.press("Enter");

    // Should go to sign-in verification (password step), not registration
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  });
});
