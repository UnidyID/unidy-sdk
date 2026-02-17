import { routes } from "../../config";
import { expect, test } from "../../fixtures";
import { readSessionStorageFromFile } from "../../lib/helpers/session-storage";

test.describe("Logout", () => {
  // Set auth token once without addInitScript (which would restore auth on reload)
  const setAuthToken = async (page: import("@playwright/test").Page) => {
    const session = readSessionStorageFromFile();
    await page.evaluate((token: string) => {
      sessionStorage.setItem("unidy_token", token);
    }, session.unidy_token);
  };

  test("logout works correctly", async ({ page }) => {
    await page.goto(routes.profile);
    await setAuthToken(page);
    await page.reload();

    const logoutButton = page.getByRole("button", { name: "Logout" });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await expect(page.getByText("You need to sign in to view your profile")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });

  test("logout sends X-ID-Token header", async ({ page }) => {
    await page.goto(routes.profile);
    await setAuthToken(page);
    await page.reload();

    const signOutRequestPromise = page.waitForRequest((request) => request.url().includes("/sign_out") && request.method() === "POST");

    const logoutButton = page.getByRole("button", { name: "Logout" });
    await logoutButton.click();

    const signOutRequest = await signOutRequestPromise;
    const headers = signOutRequest.headers();

    expect(headers["x-id-token"]).toBeDefined();
    expect(headers["x-id-token"]).not.toBe("");
  });
});
