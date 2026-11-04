import { fieldErrorMessage, isConsentGiven } from "./field-helpers";

describe("isConsentGiven", () => {
  it.each([true, 1, "true", "1", "on", "yes", "TRUE"])("treats %p as given", (value) => {
    expect(isConsentGiven(value)).toBe(true);
  });

  it.each([null, undefined, false, 0, "", "false", "0", "off", "tRuE"])("treats %p as not given", (value) => {
    expect(isConsentGiven(value)).toBe(false);
  });
});

describe("fieldErrorMessage", () => {
  it("translates error codes from client-side validation", () => {
    expect(fieldErrorMessage("field_required")).toBe("This field is required");
  });

  it("returns server and integrator messages unchanged, even when they match a translation key", () => {
    expect(fieldErrorMessage("expired")).toBe("expired");
    expect(fieldErrorMessage("Please accept the terms")).toBe("Please accept the terms");
  });
});
