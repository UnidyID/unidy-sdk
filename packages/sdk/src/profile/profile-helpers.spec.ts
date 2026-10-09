import type { MeUser, ProfileField } from "./api/schemas";
import { buildProfileNodes, buildUpdateData, filledEmptyField, optionKey, withSavedValues } from "./profile-helpers";
import type { ProfileRaw } from "./store/profile-store";

const USER = {
  id: "8b0e0d6e-6a0b-4a3c-9a43-1f0f5b2f9d10",
  email: "ada@example.com",
  first_name: "Ada",
  last_name: null,
  salutation: "mrs",
  date_of_birth: "1990-12-10",
  custom_attributes: { newsletter_ok: null, member_no: "M-1", weight: 72.5, sports: ["tennis"] },
} as unknown as MeUser;

const field = (name: string, overrides: Partial<ProfileField> = {}): ProfileField => ({
  name,
  custom_attribute: false,
  type: "text",
  label: name,
  required: false,
  readonly: false,
  locked: false,
  locked_text: null,
  options: null,
  ...overrides,
});

const YES_NO = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
  { value: null, label: "N/A" },
];

const FIELDS: ProfileField[] = [
  field("salutation", { type: "radio", options: [{ value: "mrs", label: "Mrs" }] }),
  field("first_name", { required: true }),
  field("last_name", { locked_text: "Ask the club office" }),
  field("email", { readonly: true }),
  field("member_no", { custom_attribute: true, readonly: true }),
  field("newsletter_ok", { custom_attribute: true, type: "radio", options: YES_NO }),
  field("weight", { custom_attribute: true, type: "number" }),
];

describe("buildProfileNodes", () => {
  it("puts each value next to its field's metadata, in display order", () => {
    const nodes = buildProfileNodes(USER, FIELDS);

    expect(Object.keys(nodes)).toEqual(["salutation", "first_name", "last_name", "email", "custom_attributes"]);
    expect(nodes.first_name).toEqual({
      value: "Ada",
      type: "text",
      label: "first_name",
      required: true,
      readonly: false,
      locked: false,
      locked_text: null,
      options: undefined,
      attr_name: "first_name",
    });
    expect(nodes.last_name).toMatchObject({ value: null, locked: false, locked_text: "Ask the club office" });
    expect(nodes.custom_attributes.newsletter_ok).toMatchObject({ value: null, type: "radio", options: YES_NO });
    expect(nodes.custom_attributes.member_no).toMatchObject({ value: "M-1", readonly: true });
  });

  it("leaves out a user attribute the user doesn't have, and keeps an unset custom attribute", () => {
    const nodes = buildProfileNodes(USER, [field("nickname"), field("season_pass", { custom_attribute: true })]);

    expect(nodes.nickname).toBeUndefined();
    expect(nodes.custom_attributes.season_pass.value).toBeNull();
  });
});

describe("buildUpdateData", () => {
  const nodes = (): ProfileRaw => {
    const built = buildProfileNodes(USER, FIELDS);
    built.first_name = { ...built.first_name, value: "" };
    built.custom_attributes.newsletter_ok = { ...built.custom_attributes.newsletter_ok, value: true };
    built.custom_attributes.weight = { ...built.custom_attributes.weight, value: "73.0" };
    return built;
  };

  it("sends the fields the user may change, a cleared one as null and a number as a number", () => {
    expect(buildUpdateData(nodes())).toEqual({
      salutation: "mrs",
      first_name: null,
      last_name: null,
      custom_attributes: { newsletter_ok: true, weight: 73 },
    });
  });

  it("sends only the given fields", () => {
    expect(buildUpdateData(nodes(), new Set(["first_name", "custom_attributes.newsletter_ok", "email"]))).toEqual({
      first_name: null,
      custom_attributes: { newsletter_ok: true },
    });
  });
});

describe("withSavedValues", () => {
  it("takes the saved values and keeps the fields' metadata", () => {
    const before = buildProfileNodes(USER, FIELDS);
    const saved = withSavedValues(before, {
      ...USER,
      first_name: "Augusta",
      custom_attributes: { ...USER.custom_attributes, newsletter_ok: false },
    });

    expect(saved.first_name).toEqual({ ...before.first_name, value: "Augusta" });
    expect(saved.custom_attributes.newsletter_ok).toEqual({ ...before.custom_attributes.newsletter_ok, value: false });
    expect(saved.custom_attributes.member_no).toEqual(before.custom_attributes.member_no);
  });

  it("keeps a node the user has no value for", () => {
    const data = { nickname: { value: "Ada", type: "text" }, custom_attributes: {} } as ProfileRaw;

    expect(withSavedValues(data, USER).nickname).toEqual({ value: "Ada", type: "text" });
  });
});

describe("filledEmptyField", () => {
  const before = buildProfileNodes(USER, FIELDS);

  it("is true when an empty field got a value", () => {
    expect(filledEmptyField(before, withSavedValues(before, { ...USER, last_name: "Lovelace" }))).toBe(true);
    expect(
      filledEmptyField(
        before,
        withSavedValues(before, { ...USER, custom_attributes: { ...USER.custom_attributes, newsletter_ok: false } }),
      ),
    ).toBe(true);
  });

  it("is false when only filled fields changed", () => {
    expect(filledEmptyField(before, withSavedValues(before, { ...USER, first_name: "Augusta" }))).toBe(false);
  });
});

describe("optionKey", () => {
  it("compares options as strings, with null as an empty string", () => {
    expect([true, false, null, "mr", undefined].map(optionKey)).toEqual(["true", "false", "", "mr", ""]);
  });
});
