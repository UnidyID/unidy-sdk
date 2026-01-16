import { expect, test } from "@playwright/test";
import { routes } from "../../config";

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
  });
});
