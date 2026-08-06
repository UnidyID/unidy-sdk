import { expect, test } from "@playwright/test";
import { routes, userLogin } from "../../../config";

const LOGIN_OPTIONS = { magic_link: false, password: true, social_logins: [], passkey: false };

const brand = (name: string, current: boolean) => ({
  name,
  host: `${name}.example.com`,
  url: `https://${name}.example.com`,
  display_name: name === "fanclub" ? "Fan Club" : "Partner Portal",
  logo_url: null,
  colors: { background: "#0055ff", foreground: "#ffffff", text: "#20262c" },
  current,
  login_options: LOGIN_OPTIONS,
});

// The brand list depends on backend multi-brand configuration, so the sign-in response is stubbed
// to keep the component's behaviour under test rather than the tenant's brand setup.
const stubSignIn = (brands: ReturnType<typeof brand>[]) => ({
  sid: "test-sign-in-id",
  status: "pending_verification",
  email: userLogin.email,
  expired: false,
  login_options: LOGIN_OPTIONS,
  connected_to_brand: brands.some((b) => b.current),
  brands,
});

async function submitEmail(page: import("@playwright/test").Page) {
  const email = page.getByRole("textbox", { name: "Email" });
  await email.fill(userLogin.email);
  await email.press("Enter");
}

test.describe("Auth - Brand switcher", () => {
  test("lists the other brands the user has an account on", async ({ page }) => {
    await page.route("**/api/sdk/v1/sign_ins", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(stubSignIn([brand("fanclub", true), brand("partners", false)])),
      }),
    );

    await page.goto(routes.auth);
    await submitEmail(page);

    const link = page.getByRole("link", { name: /continue on partner portal/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "https://partners.example.com");

    // The brand the user is already on is not offered as somewhere to switch to
    await expect(page.getByRole("link", { name: /continue on fan club/i })).toHaveCount(0);
  });

  test("renders nothing when the user only has the current brand", async ({ page }) => {
    await page.route("**/api/sdk/v1/sign_ins", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(stubSignIn([brand("fanclub", true)])),
      }),
    );

    await page.goto(routes.auth);
    await submitEmail(page);

    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.locator("u-brand-switcher").getByRole("link")).toHaveCount(0);
  });

  test("renders nothing when the backend returns no brands", async ({ page }) => {
    await page.route("**/api/sdk/v1/sign_ins", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(stubSignIn([])),
      }),
    );

    await page.goto(routes.auth);
    await submitEmail(page);

    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.locator("u-brand-switcher").getByRole("link")).toHaveCount(0);
  });

  test("still signs in when the backend predates the brands field", async ({ page }) => {
    await page.route("**/api/sdk/v1/sign_ins", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        // No `brands` and no `connected_to_brand`, as an older Unidy instance would respond
        body: JSON.stringify({
          sid: "test-sign-in-id",
          status: "pending_verification",
          email: userLogin.email,
          expired: false,
          login_options: LOGIN_OPTIONS,
        }),
      }),
    );

    await page.goto(routes.auth);
    await submitEmail(page);

    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.locator("u-brand-switcher").getByRole("link")).toHaveCount(0);
  });

  test("brandSelected can be intercepted to suppress the navigation", async ({ page }) => {
    await page.route("**/api/sdk/v1/sign_ins", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(stubSignIn([brand("fanclub", true), brand("partners", false)])),
      }),
    );

    await page.goto(routes.auth);
    await submitEmail(page);

    await page.evaluate(() => {
      document.addEventListener("brandSelected", (event) => {
        event.preventDefault();
        (window as unknown as { __selectedBrand?: string }).__selectedBrand = (
          event as CustomEvent<{ brand: { name: string } }>
        ).detail.brand.name;
      });
    });

    await page.getByRole("link", { name: /continue on partner portal/i }).click();

    await expect.poll(() => page.evaluate(() => (window as unknown as { __selectedBrand?: string }).__selectedBrand)).toBe("partners");
    // Navigation was suppressed, so we are still on the auth page
    await expect(page).toHaveURL(new RegExp(`${routes.auth}$`));
  });
});
