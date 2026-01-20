import { expect, test } from "@playwright/test";
import { routes } from "../../config";
import { ModelCountAssert } from "../../lib/assert/count";
import { EmailAssert } from "../../lib/assert/emails";
import { Database } from "../../lib/database";
import { extractManageSubscriptionLink } from "../../lib/helpers/newsletter";
import { randomEmail } from "../../lib/helpers/random";

test.describe("Manage Subscriptions (logged out)", () => {
  const newsletterSubscriptions = new Database("NewsletterSubscription");
  let manageSubscriptionLink: string;
  let email: string;

  test.beforeEach(async ({ page }) => {
    await page.goto(routes.newsletter);
    email = randomEmail();

    const newsletters = new Database("Newsletter");
    const main = await newsletters.getBy({ internal_name: "main" });
    if (!main) throw new Error("Newsletter 'main' not found");

    const preferences = new Database("NewsletterPreference");
    const prefClubNews = await preferences.getBy({ plugin_identifier: "club_news" } as any);
    if (!prefClubNews) throw new Error("Preference 'club_news' not found");

    const subscription = await newsletterSubscriptions.create({
      email: email,
      newsletter_id: main.id,
    });
    if (!subscription) throw new Error("Failed to create newsletter subscription");

    const preferenceSubscriptions = new Database("NewsletterPreferenceSubscription");
    await preferenceSubscriptions.create({
      newsletter_subscription_id: subscription.id,
      newsletter_preference_id: prefClubNews.id,
    });

    const userEmails = await EmailAssert.init({ to: email });
    const emailInput = page.getByRole("textbox", { name: "Email" });
    const subscribeButton = page.getByRole("button", { name: "Subscribe", exact: true });

    await emailInput.fill(email);
    await subscribeButton.click();

    await expect(page.getByTestId("nl.group.main").locator("u-error-message")).toBeVisible();
    await expect(page.getByText("We sent a link to manage your")).toBeVisible();

    await userEmails.toHaveReceived(1);

    const lastEmail = await userEmails.ensureLast();

    manageSubscriptionLink = extractManageSubscriptionLink(lastEmail.body);

    await page.goto(manageSubscriptionLink);
    await page.waitForLoadState("networkidle");
  });

  test("email field contains the correct email and is disabled", async ({ page }) => {
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(email);
    await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeDisabled();
  });

  test("shows subscribed newsletter and preferences correctly", async ({ page }) => {
    await expect(page.getByTestId("manage.nl.group.main.toggle")).toBeVisible();
    await expect(page.getByTestId("manage.nl.group.main.toggle")).toHaveText("Unsubscribe");
    await expect(page.getByTestId("manage.nl.group.main.pref.club_news")).toBeChecked();
    await expect(page.getByTestId("manage.nl.group.main.pref.player_news")).not.toBeChecked();
    await expect(page.getByTestId("manage.nl.group.main.pref.random_news")).not.toBeChecked();
  });

  test("resend DOI button is visible", async ({ page }) => {
    await expect(page.getByTestId("manage.nl.group.main.resend-doi")).toBeVisible();
  });

  test("can unsubscribe from newsletter", async ({ page }) => {
    const count = await ModelCountAssert.init("NewsletterSubscription", { scope: { email } });
    await expect(page.getByTestId("manage.nl.group.main.toggle")).toContainText("Unsubscribe");
    await page.getByTestId("manage.nl.group.main.toggle").click();
    await expect(page.getByText("You have successfully unsubscribed")).toBeVisible();
    await count.toHaveChangedBy(-1);
  });

  test("can subscribe to another newsletter", async ({ page }) => {
    const count = await ModelCountAssert.init("NewsletterSubscription", { scope: { email } });
    await page.getByTestId("manage.nl.group.test.toggle").click();
    await expect(page.getByText("You have successfully subscribed")).toBeVisible();
    await expect(page.getByTestId("manage.nl.group.test.toggle")).toContainText("Unsubscribe");
    await count.toHaveChangedBy(1);
  });
});
