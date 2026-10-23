import type { Page } from "@playwright/test";
import { routes } from "../../config";
import { expect, test } from "../../fixtures";

const text = (attr_name: string, value: string | null = null) => ({ value, type: "text", label: attr_name, attr_name, required: false });

const favoriteNut = (extra: Record<string, unknown> = {}) => ({
  value: "hazelnut",
  type: "select",
  label: "Favorite nut",
  attr_name: "favorite_nut",
  required: false,
  readonly: false,
  options: [
    { value: "peanut", label: "Peanut" },
    { value: "hazelnut", label: "Hazelnut" },
  ],
  ...extra,
});

const sportsInterests = (extra: Record<string, unknown> = {}) => ({
  value: "Football",
  type: "text",
  label: "Sports interests",
  attr_name: "sports_interests",
  required: false,
  readonly: false,
  ...extra,
});

const profilePayload = (customAttributes: Record<string, unknown>) => ({
  salutation: { value: null, type: "radio", label: "Salutation", attr_name: "salutation", required: false, radio_options: [] },
  first_name: text("first_name", "Peter"),
  last_name: text("last_name", "Parker"),
  email: text("email", "user@example.com"),
  phone_number: { value: null, type: "tel", label: "Phone number", attr_name: "phone_number", required: false },
  company_name: text("company_name"),
  address_line_1: text("address_line_1"),
  address_line_2: text("address_line_2"),
  city: text("city"),
  postal_code: text("postal_code"),
  country_code: { value: null, type: "select", label: "Country", attr_name: "country_code", required: false, options: [] },
  date_of_birth: { value: null, type: "date", label: "Date of birth", attr_name: "date_of_birth", required: false },
  custom_attributes: customAttributes,
});

// Brand ownership depends on the tenant's multi-brand setup, so the profile response is stubbed.
async function stubProfile(page: Page, customAttributes: Record<string, unknown>) {
  const requests: URL[] = [];
  await page.route(
    (url) => url.pathname === "/api/sdk/v1/profile",
    (route) => {
      if (route.request().method() !== "GET") return route.fallback();

      requests.push(new URL(route.request().url()));
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(profilePayload(customAttributes)) });
    },
  );
  return requests;
}

// u-field rendered by u-full-profile gets `field` as a property, so fields are located by their container part
const attributeField = (page: Page, name: string) => page.locator(`#profile [part~="field-container--custom_attributes-${name}"]`);
const brandPart = (page: Page, brand: string) => page.locator(`[part~="field-container--brand-${brand}"]`);

const brandedPayload = {
  favorite_nut: favoriteNut({ brand: { id: 1, name: "fanclub", display_name: "Fan Club" }, cross_brand_visible: false }),
  sports_interests: sportsInterests({ brand: { id: 2, name: "partners", display_name: "Partner Portal" }, cross_brand_visible: true }),
};

const legacyPayload = { favorite_nut: favoriteNut(), sports_interests: sportsInterests() };

test.describe("Profile - custom attribute brands", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("requests the owning brand of custom attributes", async ({ page, authenticatedContext: _authenticatedContext }) => {
    const requests = await stubProfile(page, brandedPayload);

    await page.goto(routes.profile);
    await expect(attributeField(page, "favorite_nut")).toBeVisible();

    expect(requests.length).toBeGreaterThan(0);
    for (const url of requests) {
      expect(url.searchParams.get("include_brand")).toBe("1");
    }
  });

  test("exposes the owning brand as a part on the field container", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubProfile(page, brandedPayload);

    await page.goto(routes.profile);

    await expect(attributeField(page, "favorite_nut").and(brandPart(page, "fanclub"))).toBeVisible();
    await expect(attributeField(page, "sports_interests").and(brandPart(page, "partners"))).toBeVisible();
    await expect(attributeField(page, "sports_interests").getByRole("textbox")).toHaveValue("Football");
  });

  test("hide-cross-brand hides attributes that are not linked to the current brand", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    await stubProfile(page, brandedPayload);

    await page.goto(routes.profile);
    await expect(attributeField(page, "sports_interests")).toBeVisible();

    await page.locator("#hide-cross-brand-toggle").check();

    await expect(attributeField(page, "sports_interests")).toHaveCount(0);
    await expect(attributeField(page, "favorite_nut")).toBeVisible();
    await expect(page.locator('#profile [part~="field-container--first_name"]')).toBeVisible();

    await page.locator("#hide-cross-brand-toggle").uncheck();

    await expect(attributeField(page, "sports_interests")).toBeVisible();
  });

  test("renders attributes from backends that do not send brand information", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    await stubProfile(page, legacyPayload);

    await page.goto(routes.profile);

    await expect(attributeField(page, "favorite_nut")).toBeVisible();
    await expect(attributeField(page, "sports_interests")).toBeVisible();
    await expect(page.locator('#profile [part*="field-container--brand-"]')).toHaveCount(0);

    await page.locator("#hide-cross-brand-toggle").check();
    await expect(page.locator("#profile")).toHaveJSProperty("hideCrossBrand", true);

    await expect(attributeField(page, "favorite_nut")).toBeVisible();
    await expect(attributeField(page, "sports_interests")).toBeVisible();
  });
});
