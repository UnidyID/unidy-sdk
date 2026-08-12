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

  // Brands describe one specific sign-in. Persisting them lets the switcher survive a mid-flow
  // reload, but they must never leak into an unrelated one.
  test.describe("persistence is scoped to the sign-in", () => {
    const STALE_BRAND = {
      name: "previoususer",
      host: "previous.example.com",
      url: "https://previous.example.com",
      display_name: "Previous Account",
      logo_url: null,
      colors: { background: "#0055ff", foreground: "#ffffff", text: "#20262c" },
      current: false,
      login_options: { magic_link: false, password: true, social_logins: [], passkey: false },
    };

    const staleLink = (page: import("@playwright/test").Page) => page.getByRole("link", { name: /continue on previous account/i });

    // No recoverable step: the sign-in is over, so its brands must not come back with a reload.
    test("does not surface brands when no sign-in is being resumed", async ({ page }) => {
      await page.addInitScript((brand) => {
        localStorage.setItem("unidy_signin_id", "stale-sign-in-id");
        localStorage.setItem("unidy_brands", JSON.stringify({ sid: "stale-sign-in-id", brands: [brand] }));
      }, STALE_BRAND);

      await page.goto(routes.auth);

      await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
      await expect(staleLink(page)).toHaveCount(0);
    });

    test("does not carry brands over into a sign-in started by a redirect", async ({ page }) => {
      await page.route("**/api/sdk/v1/sign_ins", (route) =>
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(stubSignIn([brand("fanclub", true), brand("partners", false)])),
        }),
      );

      // A real lookup, so the brands are persisted against its sid
      await page.goto(routes.auth);
      await submitEmail(page);
      await expect(page.getByRole("link", { name: /continue on partner portal/i })).toBeVisible();

      // A social-auth callback then arrives carrying a different sid
      await page.goto(`${routes.auth}?error=brand_connection_required&sid=other-sign-in-id`);

      await expect(page.getByRole("link", { name: /continue on partner portal/i })).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => localStorage.getItem("unidy_brands"))).toBeNull();
    });
  });
});
