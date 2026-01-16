import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../../config";

test.describe("Auth - Password step", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.auth);

    const email = page.getByRole("textbox", { name: "Email" });
    await email.fill(userLogin.email);
    await email.press("Enter");

    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with Password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with Password" })).toBeDisabled();
  });

  test("user can login with valid password", async ({ page }) => {
    const password = page.getByRole("textbox", { name: "Password" });

    await password.fill(userLogin.password);
    await password.press("Enter");

    await expect(page.getByText("You are already signed in")).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

    await page.context().storageState({ path: "playwright/.auth/user.json" });
  });

  test("wrong password shows error", async ({ page }) => {
    const password = page.getByRole("textbox", { name: "Password" });

    await password.fill("wrong-password");
    await password.press("Enter");

    const error = page.locator("#password-error");
    await expect(error).toBeVisible();
    await expect(error).toHaveText(/invalid password/i);
  });
});
