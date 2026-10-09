import type { Page } from "@playwright/test";

type Data = Record<string, unknown> & { custom_attributes?: Record<string, unknown> };

/** A request body of `PATCH /api/v2/me`. */
export type ProfilePatch = { payload: { data: Data; validate_only_sent_fields?: boolean } };

const META = { request_id: "e2e-request" };

const field = (name: string, overrides: Record<string, unknown> = {}) => ({
  name,
  custom_attribute: false,
  type: "text",
  label: name.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
  required: false,
  readonly: false,
  locked: false,
  locked_text: null,
  options: null,
  ...overrides,
});

/** `GET /api/v2/me/profile_fields`, in display order. */
export const PROFILE_FIELDS = [
  field("salutation", {
    type: "radio",
    options: [
      { value: "mr", label: "Mr" },
      { value: "mrs", label: "Mrs" },
      { value: "mx", label: "Divers" },
    ],
  }),
  field("first_name", { label: "First name" }),
  field("last_name", { label: "Last name" }),
  field("phone_number", { type: "tel", label: "Phone number" }),
  field("date_of_birth", { type: "date", label: "Date of birth" }),
  field("company_name"),
  field("address_line_1"),
  field("address_line_2"),
  field("city"),
  field("postal_code"),
  field("country_code", {
    type: "select",
    label: "Country",
    options: [
      { value: "DE", label: "Germany" },
      { value: "AT", label: "Austria" },
    ],
  }),
  field("email", { readonly: true }),
  field("preferred_language"),
  field("favorite_nut", {
    custom_attribute: true,
    type: "select",
    label: "Favorite nut",
    options: [
      { value: "peanut", label: "Peanut" },
      { value: "hazelnut", label: "Hazelnut" },
      { value: "walnut", label: "Walnut" },
    ],
  }),
  field("sports_interests", {
    custom_attribute: true,
    type: "checkbox",
    label: "Sports interests",
    options: [
      { value: "football", label: "Football" },
      { value: "tennis", label: "Tennis" },
    ],
  }),
  field("newsletter_ok", {
    custom_attribute: true,
    type: "radio",
    label: "Newsletter",
    options: [
      { value: true, label: "Yes" },
      { value: false, label: "No" },
      { value: null, label: "N/A" },
    ],
  }),
];

/** `GET /api/v2/me`. */
export const ME_USER = {
  id: "0b8a2c3e-55d1-4f0e-9a8e-6f2d7c1b4a90",
  email: "user@example.com",
  first_name: "Max",
  last_name: "Muster",
  salutation: "mr",
  gender: "male",
  date_of_birth: "1990-04-01",
  phone_number: null,
  address_line_1: null,
  address_line_2: null,
  city: "Berlin",
  postal_code: null,
  country_code: "DE",
  company_name: null,
  preferred_language: "en",
  verified: false,
  brands: ["default"],
  confirmed_at: "2026-01-01T10:00:00.000Z",
  verified_at: null,
  invitation_created_at: null,
  invitation_sent_at: null,
  invitation_accepted_at: null,
  disabled: false,
  disabled_at: null,
  custom_attributes: { favorite_nut: "peanut", sports_interests: ["football"], newsletter_ok: null },
  created_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-01-01T10:00:00.000Z",
};

const json = (status: number, body: unknown) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

/** Like the profile validation, a date of birth must be in the past. */
function validate(data: Data) {
  if (typeof data.date_of_birth === "string" && new Date(data.date_of_birth) > new Date()) {
    return [{ field: "payload.data.date_of_birth", code: "invalid", message: "Date of birth must be in the past" }];
  }
  return [];
}

/**
 * Stubs the V2 profile endpoints: `GET /api/v2/me`, `GET /api/v2/me/profile_fields`, and a `PATCH /api/v2/me`
 * that saves into the stubbed user. Returns the PATCH bodies the page sent.
 */
export async function stubProfile(page: Page): Promise<ProfilePatch[]> {
  const patches: ProfilePatch[] = [];
  let user = structuredClone(ME_USER);

  await page.route("**/api/v2/me/profile_fields", (route) => route.fulfill(json(200, { records: PROFILE_FIELDS, meta: META })));

  await page.route("**/api/v2/me", (route) => {
    const request = route.request();

    if (request.method() === "GET") {
      return route.fulfill(json(200, { record: user, meta: META }));
    }

    if (request.method() === "PATCH") {
      const body = request.postDataJSON() as ProfilePatch;
      patches.push(body);

      const details = validate(body.payload.data);
      if (details.length > 0) {
        return route.fulfill(json(422, { identifier: "unprocessable_content", details, meta: META }));
      }

      const { custom_attributes, ...data } = body.payload.data;
      user = { ...user, ...data, custom_attributes: { ...user.custom_attributes, ...custom_attributes } };
      return route.fulfill(json(200, { record: user, meta: META }));
    }

    return route.fallback();
  });

  return patches;
}
