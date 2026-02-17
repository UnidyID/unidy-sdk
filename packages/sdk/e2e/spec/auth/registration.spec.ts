import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../config";
import { ModelCountAssert } from "../../lib/assert/count";
import { Database } from "../../lib/database";
import { randomEmail } from "../../lib/helpers/random";

/** Helper: wait for either #status or #error to have content */
async function waitForResponse(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => {
      const s = document.getElementById("status");
      const e = document.getElementById("error");
      return (s?.textContent && s.textContent.length > 0) || (e?.textContent && e.textContent.length > 0);
    },
    { timeout: 10000 },
  );
}

test.describe("Registration", () => {
  const users = new Database("User");

  test.beforeEach(async ({ page }) => {
    await page.goto(routes.registration);
  });

  test("page loads with form fields and action buttons", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Registration" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("First name")).toBeVisible();
    await expect(page.getByLabel("Last name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Finalize" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("create registration shows registration state", async ({ page }) => {
    const email = randomEmail();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Test1234!");
    await page.getByRole("button", { name: "Create" }).click();

    await waitForResponse(page);

    const status = page.locator("#status");
    await expect(status).toBeVisible();
    await expect(status).toContainText('"rid"');
    await expect(status).toContainText(email);
  });

  test("update registration with profile data", async ({ page }) => {
    const email = randomEmail();

    // Create registration first
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Test1234!");
    await page.getByRole("button", { name: "Create" }).click();
    await waitForResponse(page);
    await expect(page.locator("#status")).toContainText('"rid"');

    // Update with profile data
    await page.getByLabel("First name").fill("Jane");
    await page.getByLabel("Last name").fill("Doe");
    await page.getByRole("button", { name: "Update" }).click();
    await waitForResponse(page);

    const status = page.locator("#status");
    await expect(status).toContainText("Jane");
    await expect(status).toContainText("Doe");
  });

  test("send verification code returns success", async ({ page }) => {
    const email = randomEmail();

    // Create registration
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Test1234!");
    await page.getByRole("button", { name: "Create" }).click();
    await waitForResponse(page);
    await expect(page.locator("#status")).toContainText('"email_verified": false');

    // Send verification code
    await page.getByRole("button", { name: "Send verification code" }).click();
    await waitForResponse(page);

    const status = page.locator("#status");
    await expect(status).toContainText('"success": true');
    await expect(status).toContainText('"enable_resend_after"');
  });

  test("finalize registration creates a user", async ({ page }) => {
    const email = randomEmail();
    const userCount = await ModelCountAssert.init("User");

    // Create registration
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Test1234!");
    await page.getByRole("button", { name: "Create" }).click();
    await waitForResponse(page);
    await expect(page.locator("#status")).toContainText('"rid"');

    // Finalize (email verification not required in test environment)
    await page.getByRole("button", { name: "Finalize" }).click();
    await waitForResponse(page);
    await expect(page.locator("#status")).toBeVisible();
    await expect(page.locator("#error")).not.toBeVisible();

    await userCount.toHaveChangedBy(1);

    // Cleanup: delete the created user
    const createdUser = await users.getBy({ email });
    if (createdUser) await users.destroy(createdUser.id);
  });

  test("cancel registration clears the flow", async ({ page }) => {
    const email = randomEmail();

    // Create registration
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Test1234!");
    await page.getByRole("button", { name: "Create" }).click();
    await waitForResponse(page);
    await expect(page.locator("#status")).toContainText('"rid"');

    // Cancel
    await page.getByRole("button", { name: "Cancel" }).click();
    await waitForResponse(page);

    await expect(page.locator("#status")).toBeVisible();
    await expect(page.locator("#error")).not.toBeVisible();
  });

  test("duplicate email shows error", async ({ page }) => {
    await page.getByLabel("Email").fill(userLogin.email);
    await page.getByLabel("Password").fill("Test1234!");
    await page.getByRole("button", { name: "Create" }).click();

    await waitForResponse(page);

    const error = page.locator("#error");
    await expect(error).toBeVisible();
    await expect(error).toContainText("email_already_registered");
  });

  test("finalize without prior registration shows error", async ({ page }) => {
    // Try to finalize without creating a registration first
    await page.getByRole("button", { name: "Finalize" }).click();
    await waitForResponse(page);

    const error = page.locator("#error");
    await expect(error).toBeVisible();
    await expect(error).toContainText("registration_not_found");
  });
});
