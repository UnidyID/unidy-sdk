import { validateRequiredFields } from "./profile-helpers";
import { type ProfileRaw, state as profileState } from "./store/profile-store";

const consent = (extra: Record<string, unknown> = {}) => ({
  value: null,
  type: "consent_checkbox",
  label: "I accept the Terms and Conditions",
  attr_name: "terms_accepted",
  required: true,
  readonly: false,
  ...extra,
});

const profileWith = (terms: Record<string, unknown>) => ({ custom_attributes: { terms_accepted: terms } }) as unknown as ProfileRaw;

describe("validateRequiredFields", () => {
  beforeEach(() => {
    profileState.errors = {};
  });

  it("rejects a required consent that was not given", () => {
    expect(validateRequiredFields(profileWith(consent()))).toBe(false);
    expect(profileState.errors["custom_attributes.terms_accepted"]).toBeDefined();
  });

  it("accepts a required consent that was given", () => {
    expect(validateRequiredFields(profileWith(consent({ value: true })))).toBe(true);
  });

  it.each([{ readonly: true }, { locked: true }])("skips a required field the user can't change (%p)", (extra) => {
    expect(validateRequiredFields(profileWith(consent(extra)))).toBe(true);
    expect(profileState.errors).toEqual({});
  });
});
