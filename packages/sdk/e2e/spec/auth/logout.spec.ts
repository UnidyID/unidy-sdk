import { routes } from "../../config";
import { expect, test } from "../../fixtures";

test.describe("Logout", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("logout works correctly", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);
    const logoutButton = page.getByRole("button", { name: "Logout" });
    await logoutButton.click();

    await expect(page.getByText("You need to sign in to view your profile")).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });

  test("logout sends X-ID-Token header (Safari ITP fix)", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await page.goto(routes.profile);

    // Intercept the sign_out request to verify headers
    const signOutRequestPromise = page.waitForRequest((request) => request.url().includes("/sign_out") && request.method() === "POST");

    const logoutButton = page.getByRole("button", { name: "Logout" });
    await logoutButton.click();

    const signOutRequest = await signOutRequestPromise;
    const headers = signOutRequest.headers();

    // Verify X-ID-Token header is present (required for Safari where cookies don't work)
    expect(headers["x-id-token"]).toBeDefined();
    expect(headers["x-id-token"]).not.toBe("");
  });
});
