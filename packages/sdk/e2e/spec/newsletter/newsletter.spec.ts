import { expect, test } from "@playwright/test";
import { use } from "react";
import { routes, userLogin } from "../../config";

test.describe("Newsletter", () => {
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

    await emailInput.fill(userLogin.email);
    await expect(subscribeButton).toBeEnabled();
    await expect(page.getByRole("button", { name: "Already subscribed? Click" })).toBeVisible();
  });

  test("subscribes successfully and disables preference controls", async ({ page }) => {
    const emailInput = page.getByRole("textbox", { name: "Email" });
    const subscribeButton = page.getByRole("button", { name: "Subscribe", exact: true });

    await emailInput.fill(userLogin.email);
    await subscribeButton.click();

    await expect(page.getByText("You have successfully subscribed")).toBeVisible();
    await expect(page.getByTestId("nl.group.main.switch")).toBeDisabled();
    await expect(page.getByTestId("nl.group.main.pref.player_news")).toBeDisabled();
    await expect(page.getByTestId("nl.group.main.pref.club_news")).toBeDisabled();
    await expect(page.getByTestId("nl.group.main.pref.random_news")).toBeDisabled();
  });

  test("shows error message when already subscribed", async ({ page }) => {
    const emailInput = page.getByRole("textbox", { name: "Email" });
    const subscribeButton = page.getByRole("button", { name: "Subscribe", exact: true });

    await emailInput.fill(userLogin.email);
    await subscribeButton.click();

    await expect(page.getByTestId("nl.group.main").locator("u-error-message")).toBeVisible();
    await expect(page.getByText("We sent a link to manage your")).toBeVisible();
  });
});
