import { UserProfileSchema } from "./schemas";

const text = (attr_name: string, value: string | null = null) => ({ value, type: "text", label: attr_name, attr_name, required: false });

const profilePayload = () => ({
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
  custom_attributes: {},
});

const STANDARD_FIELDS = [
  "salutation",
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "company_name",
  "address_line_1",
  "address_line_2",
  "city",
  "postal_code",
  "country_code",
  "date_of_birth",
] as const;

const withStandardFieldExtras = (extras: Record<string, unknown>) => {
  const payload = profilePayload() as Record<string, unknown>;
  for (const field of STANDARD_FIELDS) {
    payload[field] = { ...(payload[field] as object), ...extras };
  }
  return payload;
};

describe("UserProfileSchema", () => {
  it("accepts readonly: false on every standard field", () => {
    const parsed = UserProfileSchema.safeParse(withStandardFieldExtras({ readonly: false }));

    expect(parsed.success).toBe(true);
  });

  it("keeps readonly: true on standard fields", () => {
    const parsed = UserProfileSchema.parse(withStandardFieldExtras({ readonly: true }));

    expect(parsed.first_name.readonly).toBe(true);
    expect(parsed.salutation.readonly).toBe(true);
    expect(parsed.date_of_birth.readonly).toBe(true);
  });

  it("accepts standard fields without readonly from older backends", () => {
    const parsed = UserProfileSchema.parse(profilePayload());

    expect(parsed.first_name.readonly).toBeUndefined();
  });
});
