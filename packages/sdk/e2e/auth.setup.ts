import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { routes, userLogin } from "./config";
import { Database } from "./lib/database";

test("create auth state", async ({ page }) => {
  const users = new Database("User");
  const user = await users.ensureGetBy({ email: userLogin.email });
  await users.update(user.id, { first_name: "Peter", date_of_birth: null });
  await page.goto(routes.auth);

  await page.getByRole("textbox", { name: "Email" }).fill(userLogin.email);
  await page.getByRole("textbox", { name: "Email" }).press("Enter");

  await page.getByRole("textbox", { name: "Password" }).fill(userLogin.password);
  await page.getByRole("textbox", { name: "Password" }).press("Enter");

  await expect(page.getByTestId("signed.in.view")).toBeVisible();

  const session = await page.evaluate(() => JSON.stringify(sessionStorage));

  await writeFile("playwright/.auth/session.json", session, "utf-8");

  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
