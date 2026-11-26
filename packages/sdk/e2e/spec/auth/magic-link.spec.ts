import { expect, type Page, test } from "@playwright/test";
import { routes, userLogin } from "../../config";
import { Database } from "../../lib/database";

const backendUrl = process.env.E2E_SDK_BASE_URL || "http://localhost:3000";

async function requestMagicCode(page: Page) {
  await page.goto(routes.auth);

  const email = page.getByRole("textbox", { name: "Email" });
  await email.fill(userLogin.email);
  await email.press("Enter");

  await page.getByRole("button", { name: "Send Magic Code" }).click();
  await expect(page.getByText("Enter magic code you received in email")).toBeVisible();
}

test.describe("Auth - Magic link", () => {
  let magicLinks: Database<"MagicLink">;

  test.beforeEach(async () => {
    const users = new Database("User");
    const user = await users.ensureGetBy({ email: userLogin.email });

    magicLinks = new Database("MagicLink", { scope: { user_id: String(user.id) } });
    await magicLinks.destroy_all();
  });

  async function clickEmailedLink(page: Page) {
    const magicLink = await magicLinks.ensureLast();
    await page.goto(`${backendUrl}/magic_links/authenticate?token=${magicLink.token}`);
  }

  test("signs the user in when the emailed link is opened in the same browser", async ({ page }) => {
    await requestMagicCode(page);
    await clickEmailedLink(page);

    await expect(page.getByTestId("signed.in.view")).toBeVisible();
    await expect(page.getByText("Enter magic code you received in email")).toBeHidden();
  });

  test("removes the redirect parameters from the URL after signing in", async ({ page }) => {
    await requestMagicCode(page);
    await clickEmailedLink(page);

    await expect(page.getByTestId("signed.in.view")).toBeVisible();

    const { searchParams } = new URL(page.url());
    expect(searchParams.has("sdk_login_sid")).toBe(false);
    expect(searchParams.has("sid")).toBe(false);
    expect(searchParams.has("auth_payload")).toBe(false);
  });

  test("signs the user in when the emailed link is opened in a different browser", async ({ page, browser }) => {
    await requestMagicCode(page);

    const otherBrowser = await browser.newContext();
    try {
      const otherPage = await otherBrowser.newPage();
      await clickEmailedLink(otherPage);

      await expect(otherPage.getByTestId("signed.in.view")).toBeVisible();
    } finally {
      await otherBrowser.close();
    }
  });
});
