import type { ApiResponse } from "../../api/base-client";
import type { ApiClientInterface } from "../../api/base-service";
import { ProfileService, profileFieldErrors } from "./profile";
import type { MeUser, ProfileField } from "./schemas";

const respond = (status: number, data: unknown): ApiResponse<unknown> => ({
  status,
  data,
  success: status >= 200 && status < 300,
  headers: new Headers(),
  connectionError: false,
});

const USER: MeUser = {
  id: "8b0e0d6e-6a0b-4a3c-9a43-1f0f5b2f9d10",
  email: "ada@example.com",
  first_name: "Ada",
  last_name: "Lovelace",
  salutation: "mrs",
  gender: "female",
  date_of_birth: "1990-12-10",
  phone_number: null,
  address_line_1: null,
  address_line_2: null,
  city: "London",
  postal_code: null,
  country_code: "GB",
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
  custom_attributes: { newsletter_ok: null, tier: "gold" },
  created_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-01-01T10:00:00.000Z",
};

const FIELD: ProfileField = {
  name: "salutation",
  custom_attribute: false,
  type: "radio",
  label: "Salutation",
  required: false,
  readonly: false,
  locked: false,
  locked_text: null,
  options: [
    { value: "mr", label: "Mr" },
    { value: "mrs", label: "Mrs" },
  ],
};

function setup(response: ApiResponse<unknown>) {
  const mocks = {
    get: jest.fn(async (..._args: unknown[]) => response),
    post: jest.fn(async (..._args: unknown[]) => response),
    patch: jest.fn(async (..._args: unknown[]) => response),
    delete: jest.fn(async (..._args: unknown[]) => response),
  };
  const client = { baseUrl: "https://unidy.example", api_key: "key", ...mocks } as unknown as ApiClientInterface;
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
  const service = new ProfileService(client, { getIdToken: async () => "id-token", logger });

  return { client: mocks, service };
}

describe("ProfileService", () => {
  it("gets the signed-in user", async () => {
    const { client, service } = setup(respond(200, { record: USER, meta: { request_id: "r" } }));

    expect(await service.get()).toEqual([null, USER]);
    expect(client.get.mock.calls[0].slice(0, 2)).toEqual(["/api/v2/me", { "X-ID-Token": "id-token" }]);
  });

  it("gets the profile form, unpaginated", async () => {
    const { client, service } = setup(respond(200, { records: [FIELD], meta: { request_id: "r" } }));

    expect(await service.fields()).toEqual([null, [FIELD]]);
    expect(client.get.mock.calls[0][0]).toBe("/api/v2/me/profile_fields");
  });

  it("keeps a yes/no radio's null option", async () => {
    const yesNo: ProfileField = {
      ...FIELD,
      name: "newsletter_ok",
      custom_attribute: true,
      options: [
        { value: true, label: "Yes" },
        { value: false, label: "No" },
        { value: null, label: "N/A" },
      ],
    };
    const { service } = setup(respond(200, { records: [yesNo], meta: {} }));

    expect(await service.fields()).toEqual([null, [yesNo]]);
  });

  it("patches the user with the payload, and returns the updated user", async () => {
    const { client, service } = setup(respond(200, { record: { ...USER, first_name: "Augusta" }, meta: {} }));

    const [error, user] = await service.update({ payload: { data: { first_name: "Augusta" }, validate_only_sent_fields: true } });

    expect(error).toBeNull();
    expect((user as MeUser).first_name).toBe("Augusta");
    expect(client.patch).toHaveBeenCalledWith(
      "/api/v2/me",
      { payload: { data: { first_name: "Augusta" }, validate_only_sent_fields: true } },
      { "X-ID-Token": "id-token" },
    );
  });

  it("returns a rejected update with the error envelope", async () => {
    const body = {
      identifier: "unprocessable_content",
      details: [{ field: "payload.data.date_of_birth", code: "invalid", message: "Date of birth must be in the past" }],
    };
    const { service } = setup(respond(422, { ...body, meta: { request_id: "r" } }));

    expect(await service.update({ payload: { data: { date_of_birth: "2999-01-01" } } })).toEqual(["unprocessable_content", body]);
  });
});

describe("profileFieldErrors", () => {
  it("names the fields without the body path, joining several messages of one field", () => {
    const errors = profileFieldErrors({
      identifier: "unprocessable_content",
      details: [
        { field: "payload.data.first_name", code: "too_long", message: "First name is too long" },
        { field: "payload.data.first_name", code: "invalid", message: "First name is invalid" },
        { field: "payload.data.custom_attributes.tier", code: "invalid", message: "Custom attributes tier cannot be changed" },
        { field: "payload.data.custom_attributes", code: "not_found", message: "no_such_attribute" },
        { field: "payload.validate_only_sent_fields", code: "type", message: "must be a boolean" },
        { field: null, code: "invalid", message: "Something went wrong" },
      ],
    });

    expect(errors).toEqual({
      first_name: "First name is too long | First name is invalid",
      "custom_attributes.tier": "Custom attributes tier cannot be changed",
      custom_attributes: "no_such_attribute",
    });
  });

  it("falls back to the code without a message", () => {
    expect(profileFieldErrors({ identifier: "unprocessable_content", details: [{ field: "payload.data.city", code: "blank" }] })).toEqual({
      city: "blank",
    });
  });
});
