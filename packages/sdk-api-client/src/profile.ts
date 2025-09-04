import type { ApiClient, ApiResponse } from "./api_client";
import * as z from "zod";

const FieldType = z.enum(["text", "textarea", "number", "boolean", "select", "radio", "date", "datetime-local", "checkbox"]);

const SelectOptionSchema = z.object({
  value: z.string(),
  label: z.string()
}).strict();

const RadioValue = z.union([z.string(), z.literal("_NOT_SET_"), z.boolean()]);

const RadioOptionSchema = z.object({
  value: RadioValue,
  label: z.string(),
  checked: z.boolean()
}).strict();


const FieldSchema = z.object({
  value: z.union([z.string(), z.null(), z.boolean(), z.number(), z.array(z.string())]),
  type: FieldType,
  required: z.boolean(),
  label: z.string(),
  attr_name: z.string(),
  locked: z.boolean().optional(),
  locked_text: z.string().optional(),
  radio_options: z.array(RadioOptionSchema).optional(),
  options: z.array(SelectOptionSchema).optional()
}).strict();

const UserProfileSchema = z.object({
  salutation: FieldSchema,
  first_name: FieldSchema,
  last_name: FieldSchema,
  email: FieldSchema,
  phone_number: FieldSchema,
  company_name: FieldSchema,
  address_line_1: FieldSchema,
  address_line_2: FieldSchema,
  city: FieldSchema,
  postal_code: FieldSchema,
  country_code: FieldSchema,
  date_of_birth: FieldSchema,
  preferred_language: FieldSchema.optional(),
  custom_attributes: z.record(z.string(), FieldSchema)
})

const UserProfileErrorSchema = z.object({
  error_identifier: z.string()
}).strict();

const FormErrorsValue = z.union([
  z.array(z.string()),
  z.array(z.tuple([z.number(), z.array(z.string())])),
]);

const FormErrorsRawSchema = z.record(z.string(), FormErrorsValue);

const UserProfileFormErrorSchema = z.object({
  errors: FormErrorsRawSchema,
}).strict().transform(({ errors }) => {
  const flatErrors = Object.fromEntries(
    Object.entries(errors).map(([field, value]) => {
      const errorMessages =
        Array.isArray(value) && value.length > 0 && typeof value[0] === "string"
          ? (value as string[])
          : (value as Array<[number, string[]]>).flatMap(([, arr]) => arr);
      return [field, errorMessages.join(" | ")];
    })
  );
  return { errors, flatErrors };
});

export type UserProfileData = z.infer<typeof UserProfileSchema>;
export type UserProfileError = z.infer<typeof UserProfileErrorSchema>;
export type UserProfileFormError = z.infer<typeof UserProfileFormErrorSchema>;

const ProfileResultSchema = z.union([
  UserProfileSchema,
  UserProfileErrorSchema,
  UserProfileFormErrorSchema,
]);

export type ProfileResult =
  | UserProfileData
  | UserProfileError
  | UserProfileFormError
  | Record<string, string>;

declare global {
  interface Window {
    UNIDY?: { auth?: { id_token?: string } };
  }
}

export class ProfileService {
  constructor(private client: ApiClient) {}

  async fetchProfile(idToken?: string): Promise<ApiResponse<ProfileResult>> {
    const token = idToken ?? window.UNIDY?.auth?.id_token;
    if (!token) {
      return { status: 401, success: false, headers: new Headers(), error: "missing id_token" };
    }

    try {
      const resp = await this.client.get<unknown>("/api/sdk/v1/profile", { "X-ID-Token": token });

      const parsed = ProfileResultSchema.safeParse(resp.data);
      if (!parsed.success) {
        return { status: 400, success: false, headers: new Headers(), error: "invalid profile data" };
      }

      const data = parsed.data;

      if ("error_identifier" in data) {
        return { ...resp, data, error: data.error_identifier };
      }

      return { ...resp, data };
    } catch (e) {
      return {
        status: e instanceof TypeError ? 0 : 500,
        success: false,
        headers: new Headers(),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async updateProfile(idToken: string, data: unknown): Promise<ApiResponse<ProfileResult>> {
    if (!idToken) {
      return { status: 401, success: false, headers: new Headers(), error: "missing id_token" };
    }

    const payload = data as object;

    try {
      const resp = await this.client.patch<unknown>("/api/sdk/v1/profile", { ...payload }, { "X-ID-Token": idToken });

      const parsed = ProfileResultSchema.safeParse(resp.data);
      if (!parsed.success) {
        return { status: 400, success: false, headers: new Headers(), error: "invalid profile data" };
      }

      const result = parsed.data;

      if ("errors" in result) {
        return { ...resp, data: result };
      }

      if ("error_identifier" in result) {
        return { ...resp, data: result, error: result.error_identifier };
      }

      return { ...resp, data: result };
    } catch (e) {
      return {
        status: e instanceof TypeError ? 0 : 500,
        success: false,
        headers: new Headers(),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
