import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../config";

test.describe("Authentication - Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.auth);
  });

  test("should display login form", async ({ page }) => {
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  });

  test("should login with password", async ({ page }) => {
    await page.getByRole("textbox", { name: "Email" }).fill(userLogin.email);
    await page.getByRole("textbox", { name: "Email" }).press("Enter");
    await page.getByRole("textbox", { name: "Password" });
    await page.getByRole("textbox", { name: "Password" }).fill(userLogin.password);
    await page.getByRole("textbox", { name: "Password" }).press("Enter");

    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  });
});
