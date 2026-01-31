import { expect, test } from "@playwright/test";
import { routes } from "../config";

test("dev server is reachable on baseURL", async ({ page }) => {
  const response = await page.goto(routes.home);
  expect(response).not.toBeNull();
  if (response) {
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(400);
  }
});
