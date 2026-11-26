import { expect, type Page, test } from "@playwright/test";
import { routes } from "../../config";
import { Database } from "../../lib/database";
import { randomEmail } from "../../lib/helpers/random";

const backendUrl = process.env.E2E_SDK_BASE_URL || "http://localhost:3000";

async function requestMagicCode(page: Page, userEmail: string) {
  await page.goto(routes.auth);

  const email = page.getByRole("textbox", { name: "Email" });
  await email.fill(userEmail);
  await email.press("Enter");

  await page.getByRole("button", { name: "Send Magic Code" }).click();
  await expect(page.getByText("Enter magic code you received in email")).toBeVisible();
}

test.describe("Auth - Magic link", () => {
  let email: string;
  let magicLinks: Database<"MagicLink">;

  test.beforeEach(async () => {
    email = randomEmail();

    const [brand] = await new Database("Brand", { scope: { default: true } }).list();
    const user = await new Database("User", { scope: { email } }).create({
      email,
      password: "Ch4ngeme!",
      first_name: "Peter",
      current_brand: brand.id,
      confirmed_at: new Date().toISOString(),
    });
    if (!user) throw new Error("Failed to create user");

    magicLinks = new Database("MagicLink", { scope: { user_id: String(user.id) } });
  });

  async function clickEmailedLink(page: Page) {
    const magicLink = await magicLinks.ensureLast();
    await page.goto(`${backendUrl}/magic_links/authenticate?token=${magicLink.token}`);
  }

  test("signs the user in when the emailed link is opened in the same browser", async ({ page }) => {
    await requestMagicCode(page, email);
    await clickEmailedLink(page);

    await expect(page.getByTestId("signed.in.view")).toBeVisible();
    await expect(page.getByText("Enter magic code you received in email")).toBeHidden();
  });

  test("removes the redirect parameters from the URL after signing in", async ({ page }) => {
    await requestMagicCode(page, email);
    await clickEmailedLink(page);

    await expect(page.getByTestId("signed.in.view")).toBeVisible();

    const { searchParams } = new URL(page.url());
    expect(searchParams.has("sdk_login_sid")).toBe(false);
    expect(searchParams.has("sid")).toBe(false);
    expect(searchParams.has("auth_payload")).toBe(false);
  });

  test("signs the user in when the emailed link is opened in a different browser", async ({ page, browser }) => {
    await requestMagicCode(page, email);

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
