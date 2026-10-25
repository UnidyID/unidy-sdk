import type { Page } from "@playwright/test";
import { routes } from "../../config";
import { expect, test } from "../../fixtures";
import { PROFILE_FIELDS, stubProfile } from "./helpers";

// Brand ownership depends on the tenant's multi-brand setup, so the user attributes are stubbed.
const withBrands = (brands: Record<string, Record<string, unknown>>) =>
  PROFILE_FIELDS.map((field) => (field.name in brands ? { ...field, ...brands[field.name] } : field));

const brandedFields = withBrands({
  favorite_nut: { brand: { name: "fanclub", display_name: "Fan Club" }, cross_brand_visible: false },
  sports_interests: { brand: { name: "partners", display_name: "Partner Portal" }, cross_brand_visible: true },
});

// u-field rendered by u-full-profile gets `field` as a property, so fields are located by their container part
const attributeField = (page: Page, name: string) => page.locator(`#profile [part~="field-container--custom_attributes-${name}"]`);
const brandPart = (page: Page, brand: string) => page.locator(`[part~="field-container--brand-${brand}"]`);

test.describe("Profile - custom attribute brands", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("exposes the owning brand as a part on the field container", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubProfile(page, brandedFields);

    await page.goto(routes.profile);

    await expect(attributeField(page, "favorite_nut").and(brandPart(page, "fanclub"))).toBeVisible();
    await expect(attributeField(page, "sports_interests").and(brandPart(page, "partners"))).toBeVisible();
  });

  test("hide-cross-brand hides attributes that are not linked to the current brand", async ({
    page,
    authenticatedContext: _authenticatedContext,
  }) => {
    await stubProfile(page, brandedFields);

    await page.goto(routes.profile);
    await expect(attributeField(page, "sports_interests")).toBeVisible();

    await page.locator("#hide-cross-brand-toggle").check();

    await expect(attributeField(page, "sports_interests")).toHaveCount(0);
    await expect(attributeField(page, "favorite_nut")).toBeVisible();
    await expect(page.locator('#profile [part~="field-container--first_name"]')).toBeVisible();

    await page.locator("#hide-cross-brand-toggle").uncheck();

    await expect(attributeField(page, "sports_interests")).toBeVisible();
  });

  test("renders attributes the API sends without brand information", async ({ page, authenticatedContext: _authenticatedContext }) => {
    await stubProfile(page);

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
