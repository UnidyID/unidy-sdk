import { expect, test } from "@playwright/test";
import { routes } from "../../config";
import { Database } from "../../lib/database";
import { randomEmail } from "../../lib/helpers/random";

test.describe("Newsletter login redirect URI", () => {
  test("uses custom redirect-uri when set on u-newsletter-root", async ({ page }) => {
    const customRedirectUri = "https://example.com/preferences?token={preference_token}";

    const newsletterSubscriptions = new Database("NewsletterSubscription");
    const newsletters = new Database("Newsletter");
    const main = await newsletters.getBy({ internal_name: "main" });
    if (!main) throw new Error("Newsletter 'main' not found");

    const email = randomEmail();
    const subscription = await newsletterSubscriptions.create({ email, newsletter_id: main.id });
    if (!subscription) throw new Error("Failed to create newsletter subscription");

    let capturedRedirectUri: string | undefined;

    await page.route("**/api/sdk/v1/newsletters/newsletter_subscription/login_email", async (route) => {
      const body = route.request().postDataJSON() as { email: string; redirect_uri: string };
      capturedRedirectUri = body.redirect_uri;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.goto(routes.newsletter);

    await page.evaluate((uri) => {
      const root = document.querySelector("u-newsletter-root");
      if (root) root.setAttribute("redirect-uri", uri);
    }, customRedirectUri);

    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("button", { name: "Already subscribed? Click" }).click();

    await expect(page.getByText("We sent a link to manage your")).toBeVisible();
    expect(capturedRedirectUri).toBe(customRedirectUri);
  });

  test("falls back to current page URL when redirect-uri is not set", async ({ page }) => {
    const newsletterSubscriptions = new Database("NewsletterSubscription");
    const newsletters = new Database("Newsletter");
    const main = await newsletters.getBy({ internal_name: "main" });
    if (!main) throw new Error("Newsletter 'main' not found");

    const email = randomEmail();
    const subscription = await newsletterSubscriptions.create({ email, newsletter_id: main.id });
    if (!subscription) throw new Error("Failed to create newsletter subscription");

    let capturedRedirectUri: string | undefined;

    await page.route("**/api/sdk/v1/newsletters/newsletter_subscription/login_email", async (route) => {
      const body = route.request().postDataJSON() as { email: string; redirect_uri: string };
      capturedRedirectUri = body.redirect_uri;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.goto(routes.newsletter);

    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("button", { name: "Already subscribed? Click" }).click();

    await expect(page.getByText("We sent a link to manage your")).toBeVisible();
    expect(capturedRedirectUri).toContain("localhost");
    expect(capturedRedirectUri).not.toContain("redirect-uri");
  });

  test("shows already_subscribed error on subscribe; clicking the link sends login email with custom redirect-uri", async ({ page }) => {
    const customRedirectUri = "https://example.com/preferences?token={preference_token}";

    const newsletterSubscriptions = new Database("NewsletterSubscription");
    const newsletters = new Database("Newsletter");
    const main = await newsletters.getBy({ internal_name: "main" });
    if (!main) throw new Error("Newsletter 'main' not found");

    const email = randomEmail();
    const subscription = await newsletterSubscriptions.create({ email, newsletter_id: main.id });
    if (!subscription) throw new Error("Failed to create newsletter subscription");

    let loginEmailRequestCount = 0;
    let capturedRedirectUri: string | undefined;

    await page.route("**/api/sdk/v1/newsletters/newsletter_subscription/login_email", async (route) => {
      loginEmailRequestCount++;
      const body = route.request().postDataJSON() as { email: string; redirect_uri: string };
      capturedRedirectUri = body.redirect_uri;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.goto(routes.newsletter);

    await page.evaluate((uri) => {
      const root = document.querySelector("u-newsletter-root");
      if (root) root.setAttribute("redirect-uri", uri);
    }, customRedirectUri);

    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByTestId("nl.consent.checkbox").check();
    await page.getByRole("button", { name: "Subscribe", exact: true }).click();

    // Subscribe should NOT auto-send a login email; per-newsletter error is shown instead.
    await expect(page.getByText("Already subscribed").first()).toBeVisible();
    expect(loginEmailRequestCount).toBe(0);

    // User clicks the link to manage existing subscriptions.
    await page.getByRole("button", { name: "Already subscribed? Click" }).click();

    await expect(page.getByText("We sent a link to manage your")).toBeVisible();
    expect(loginEmailRequestCount).toBe(1);
    expect(capturedRedirectUri).toBe(customRedirectUri);
  });

  test("shows already_subscribed error on subscribe; clicking the link falls back to current page URL", async ({ page }) => {
    const newsletterSubscriptions = new Database("NewsletterSubscription");
    const newsletters = new Database("Newsletter");
    const main = await newsletters.getBy({ internal_name: "main" });
    if (!main) throw new Error("Newsletter 'main' not found");

    const email = randomEmail();
    const subscription = await newsletterSubscriptions.create({ email, newsletter_id: main.id });
    if (!subscription) throw new Error("Failed to create newsletter subscription");

    let loginEmailRequestCount = 0;
    let capturedRedirectUri: string | undefined;

    await page.route("**/api/sdk/v1/newsletters/newsletter_subscription/login_email", async (route) => {
      loginEmailRequestCount++;
      const body = route.request().postDataJSON() as { email: string; redirect_uri: string };
      capturedRedirectUri = body.redirect_uri;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.goto(routes.newsletter);

    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByTestId("nl.consent.checkbox").check();
    await page.getByRole("button", { name: "Subscribe", exact: true }).click();

    await expect(page.getByText("Already subscribed").first()).toBeVisible();
    expect(loginEmailRequestCount).toBe(0);

    await page.getByRole("button", { name: "Already subscribed? Click" }).click();

    await expect(page.getByText("We sent a link to manage your")).toBeVisible();
    expect(loginEmailRequestCount).toBe(1);
    expect(capturedRedirectUri).toContain("localhost");
    expect(capturedRedirectUri).not.toContain("redirect-uri");
  });
});
