import { expect, test } from "@playwright/test";
import { routes } from "../../config";
import { ModelCountAssert } from "../../lib/assert/count";
import { EmailAssert } from "../../lib/assert/emails";
import { Database } from "../../lib/database";
import { randomEmail } from "../../lib/helpers/random";
import { extractManageSubscriptionLink } from "./helpers";

test.describe("Newsletter (logged out)", () => {
  const newsletterSubscriptions = new Database("NewsletterSubscription");
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.newsletter);
  });

  test("newsletter page loads successfully", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Subscribe to our Newsletter", exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Subscribe" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Subscribe" })).toBeDisabled();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByTestId("nl.group.main")).toBeVisible();
    await expect(page.getByTestId("nl.group.main.switch")).toBeVisible();
    await expect(page.getByTestId("nl.group.main.pref.player_news")).toBeVisible();
    await expect(page.getByTestId("nl.group.main.pref.club_news")).toBeVisible();
    await expect(page.getByTestId("nl.group.main.pref.random_news")).toBeVisible();
    await expect(page.getByTestId("nl.group.main.switch")).toHaveAttribute("checked", "true");
    await expect(page.getByTestId("nl.group.main.pref.club_news")).toHaveAttribute("checked", "true");
  });

  test("enables Subscribe button and shows 'Already subscribed' action after entering email", async ({ page }) => {
    const emailInput = page.getByRole("textbox", { name: "Email" });
    const subscribeButton = page.getByRole("button", { name: "Subscribe", exact: true });

    await emailInput.fill(randomEmail());
    await expect(subscribeButton).toBeEnabled();
    await expect(page.getByRole("button", { name: "Already subscribed? Click" })).toBeVisible();
  });

  test("subscribes successfully and disables preference controls", async ({ page }) => {
    await newsletterSubscriptions.destroy_all();

    const email = randomEmail();

    const nl_sub = await ModelCountAssert.init("NewsletterSubscription", { scope: { email } });

    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByTestId("nl.consent.checkbox").check();
    await page.getByRole("button", { name: "Subscribe", exact: true }).click();

    await expect(page.getByText("You have successfully subscribed")).toBeVisible();
    await expect(page.getByTestId("nl.group.main.switch")).toBeDisabled();
    await expect(page.getByTestId("nl.group.main.pref.player_news")).toBeDisabled();
    await expect(page.getByTestId("nl.group.main.pref.club_news")).toBeDisabled();
    await expect(page.getByTestId("nl.group.main.pref.random_news")).toBeDisabled();

    await nl_sub.toHaveChangedBy(1);
  });

  test("already subscribed flow: shows error", async ({ page }) => {
    const email = randomEmail();

    const newsletters = new Database("Newsletter");
    const main = await newsletters.getBy({ internal_name: "main" });
    if (!main) throw new Error("Newsletter 'main' not found");

    const preferences = new Database("NewsletterPreference");
    const prefClubNews = await preferences.getBy({ plugin_identifier: "club_news" });
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

    const emailInput = page.getByRole("textbox", { name: "Email" });
    const subscribeButton = page.getByRole("button", { name: "Subscribe", exact: true });

    await emailInput.fill(email);
    await page.getByTestId("nl.consent.checkbox").check();
    await subscribeButton.click();

    await expect(page.getByTestId("nl.group.main").locator("u-error-message")).toBeVisible();
  });

  test("sends email with manage link, navigates to manage subscription page", async ({ page }) => {
    const email = randomEmail();

    const newsletters = new Database("Newsletter");
    const main = await newsletters.getBy({ internal_name: "main" });
    if (!main) throw new Error("Newsletter 'main' not found");

    const preferences = new Database("NewsletterPreference");
    const prefClubNews = await preferences.getBy({ plugin_identifier: "club_news" });
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

    await emailInput.fill(email);
    await page.getByRole("button", { name: "Already subscribed? Click" }).click();

    await expect(page.getByText("We sent a link to manage your")).toBeVisible();

    await userEmails.toHaveReceived(1);

    const lastEmail = await userEmails.ensureLast();

    const manageSubscriptionLink = extractManageSubscriptionLink(lastEmail.body);

    await page.goto(manageSubscriptionLink);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Your subscriptions", exact: true })).toBeVisible();
  });

  test("requires consent to be accepted before subscribing", async ({ page }) => {
    const email = randomEmail();
    const emailInput = page.getByRole("textbox", { name: "Email" });
    const subscribeButton = page.getByRole("button", { name: "Subscribe", exact: true });

    const subscriptions = await ModelCountAssert.init("NewsletterSubscription", { scope: { email } });

    await emailInput.fill(email);

    await subscribeButton.click();
    await expect(page.locator("u-error-message").filter({ hasText: "Please accept the terms and" })).toBeVisible();
    await subscriptions.toHaveChangedBy(0);
  });
});
