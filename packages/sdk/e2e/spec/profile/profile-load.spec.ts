import { expect, test } from "@playwright/test";
import { routes } from "../../config";

test.use({ storageState: "playwright/.auth/user.json" });

test("profile loads", async ({ page }) => {
  await page.goto(routes.auth);
  const cookies = await page.context().cookies();
  console.log(cookies.filter((c) => c.name.includes("unidy")));

  const sentCookies = await page.evaluate(() => document.cookie);
  console.log("document.cookie:", sentCookies);

  console.log("URL after goto:", page.url());

  const ls = await page.evaluate(() => ({
    origin: window.location.origin,
    keys: Object.keys(localStorage),
    sid: localStorage.getItem("unidy_signin_id"),
    hasIdToken: !!localStorage.getItem("unidy_id_token"),
    hasRefreshToken: !!localStorage.getItem("unidy_refresh_token"),
  }));

  console.log("localStorage:", ls);

  await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible({ timeout: 60_000 });
});
