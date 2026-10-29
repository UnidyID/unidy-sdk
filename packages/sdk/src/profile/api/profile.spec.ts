import type { ApiClientInterface } from "../../api/base-service";
import { ProfileService } from "./profile";
import { CustomFieldSchema, type UserProfileData } from "./schemas";

const text = (attr_name: string, value: string | null = null) => ({ value, type: "text", label: attr_name, attr_name, required: false });

const customAttribute = (attr_name: string, extra: Record<string, unknown> = {}) => ({
  value: "hazelnut",
  type: "select",
  label: attr_name,
  attr_name,
  required: false,
  readonly: false,
  options: [{ value: "hazelnut", label: "Hazelnut" }],
  ...extra,
});

const consentAttribute = (value: true | null) => ({
  value,
  type: "consent_checkbox",
  label: "I have read and accepted the Terms and Conditions",
  attr_name: "terms_accepted",
  required: true,
  readonly: false,
});

const profilePayload = (customAttributes: Record<string, unknown>) => ({
  salutation: { value: null, type: "radio", label: "Salutation", attr_name: "salutation", required: false, radio_options: [] },
  first_name: text("first_name", "Jane"),
  last_name: text("last_name", "Doe"),
  email: text("email", "jane@example.com"),
  phone_number: { value: null, type: "tel", label: "Phone", attr_name: "phone_number", required: false },
  company_name: text("company_name"),
  address_line_1: text("address_line_1"),
  address_line_2: text("address_line_2"),
  city: text("city"),
  postal_code: text("postal_code"),
  country_code: { value: null, type: "select", label: "Country", attr_name: "country_code", required: false, options: [] },
  date_of_birth: { value: null, type: "date", label: "Date of birth", attr_name: "date_of_birth", required: false },
  custom_attributes: customAttributes,
});

const ownedBrand = { id: 12, name: "fczurich", display_name: "FC Zürich" };

describe("CustomFieldSchema", () => {
  it("accepts the owning brand and cross-brand visibility", () => {
    const parsed = CustomFieldSchema.parse(customAttribute("favorite_nut", { brand: ownedBrand, cross_brand_visible: true }));

    expect(parsed.brand).toEqual(ownedBrand);
    expect(parsed.cross_brand_visible).toBe(true);
  });

  it("accepts attributes without brand information from backends that do not send it", () => {
    const parsed = CustomFieldSchema.parse(customAttribute("favorite_nut"));

    expect(parsed.brand).toBeUndefined();
    expect(parsed.cross_brand_visible).toBeUndefined();
  });

  it("accepts a null brand for attributes without an owner", () => {
    const parsed = CustomFieldSchema.parse(customAttribute("favorite_nut", { brand: null, cross_brand_visible: false }));

    expect(parsed.brand).toBeNull();
    expect(parsed.cross_brand_visible).toBe(false);
  });

  it("accepts brand keys added by newer backends", () => {
    const parsed = CustomFieldSchema.safeParse(customAttribute("favorite_nut", { brand: { ...ownedBrand, logo_url: null } }));

    expect(parsed.success).toBe(true);
  });

  it.each<true | null>([true, null])("accepts a consent checkbox with value %p", (value) => {
    const parsed = CustomFieldSchema.parse(consentAttribute(value));

    expect(parsed.type).toBe("consent_checkbox");
    expect(parsed.value).toBe(value);
  });
});

describe("ProfileService", () => {
  const makeClient = (data: unknown) => {
    const response = { success: true, status: 200, headers: new Headers(), data };
    return {
      baseUrl: "https://unidy.example.com",
      api_key: "api-key",
      get: jest.fn().mockResolvedValue(response),
      post: jest.fn(),
      patch: jest.fn().mockResolvedValue(response),
      delete: jest.fn(),
    } satisfies ApiClientInterface;
  };

  const deps = { getIdToken: async () => "id-token", getLocale: () => "de" };
  const payload = profilePayload({ favorite_nut: customAttribute("favorite_nut", { brand: ownedBrand, cross_brand_visible: false }) });

  it("requests brand information when fetching the profile", async () => {
    const client = makeClient(payload);

    const [error, data] = await new ProfileService(client, deps).get();

    expect(error).toBeNull();
    expect(client.get.mock.calls[0][0]).toBe("/api/sdk/v1/profile?include_brand=1&lang=de");
    expect((data as UserProfileData).custom_attributes.favorite_nut.brand).toEqual(ownedBrand);
  });

  it("requests brand information when updating the profile", async () => {
    const client = makeClient(payload);

    const [error] = await new ProfileService(client, deps).update({ payload: { first_name: "Jane" } });

    expect(error).toBeNull();
    expect(client.patch.mock.calls[0][0]).toBe("/api/sdk/v1/profile?include_brand=1&lang=de");
  });

  it("parses a profile containing a consent checkbox", async () => {
    const consent = consentAttribute(true);
    const client = makeClient(profilePayload({ terms_accepted: consent }));

    const [error, data] = await new ProfileService(client, deps).get();

    expect(error).toBeNull();
    expect((data as UserProfileData).custom_attributes.terms_accepted).toEqual(consent);
  });

  it("omits lang when no locale is set", async () => {
    const client = makeClient(payload);

    await new ProfileService(client, { ...deps, getLocale: () => "" }).get();

    expect(client.get.mock.calls[0][0]).toBe("/api/sdk/v1/profile?include_brand=1");
  });
});
