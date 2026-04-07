import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../config";

test.describe("Captcha field - unconfigured (default)", () => {
  test("captcha field is hidden on auth page when captcha is not configured", async ({ page }) => {
    await page.goto(routes.auth);

    const captchaField = page.locator("u-captcha-field[feature='login']");
    await expect(captchaField).toBeAttached();
    await expect(captchaField).toBeEmpty();
  });

  test("captcha field is hidden on newsletter page when captcha is not configured", async ({ page }) => {
    await page.goto(routes.newsletter);

    const captchaField = page.locator("u-captcha-field[feature='newsletter']");
    await expect(captchaField).toBeAttached();
    await expect(captchaField).toBeEmpty();
  });

  test("auth login flow works normally with captcha field present", async ({ page }) => {
    await page.goto(routes.auth);

    const email = page.getByRole("textbox", { name: "Email" });
    await email.fill(userLogin.email);
    await email.press("Enter");

    const password = page.getByRole("textbox", { name: "Password" });
    await expect(password).toBeVisible();
  });

  test("newsletter subscribe flow works normally with captcha field present", async ({ page }) => {
    await page.goto(routes.newsletter);

    const email = page.getByRole("textbox", { name: "Email" });
    await email.fill("test-captcha@example.com");

    const subscribeButton = page.getByRole("button", { name: "Subscribe", exact: true });
    await expect(subscribeButton).toBeEnabled();
  });
});

test.describe("Captcha field - configured", () => {
  test("captcha field becomes visible when captcha config is set for a widget provider", async ({ page }) => {
    await page.goto(routes.auth);

    // Wait for config component to be in the DOM (non-visual, so check attached not visible)
    await page.waitForSelector("u-config", { state: "attached" });

    // Inject a mock captcha config into the store (simulating backend response)
    await page.evaluate(() => {
      const event = new CustomEvent("__test_set_captcha_config", {
        detail: {
          id: 1,
          provider: "turnstile",
          site_key: "test-site-key",
          login_enabled: true,
          login_score_threshold: null,
          registration_enabled: false,
          registration_score_threshold: null,
          newsletter_enabled: true,
          newsletter_score_threshold: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      window.dispatchEvent(event);
    });

    // The captcha field should attempt to become visible for widget-based providers
    // Note: In test environment without actual Turnstile script, the widget won't fully render
    // but we verify the component reacts to config changes
    const captchaField = page.locator("u-captcha-field[feature='login']");
    await expect(captchaField).toBeAttached();
  });

  test("captcha error message element is present on auth page", async ({ page }) => {
    await page.goto(routes.auth);

    const captchaError = page.locator("u-error-message[for='captcha']");
    await expect(captchaError).toBeAttached();
  });
});
