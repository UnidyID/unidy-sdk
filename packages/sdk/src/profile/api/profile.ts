import type { ApiClient, ApiResponse } from "../../sdk/src/api/src/api_client";
import * as z from "zod";

const FieldType = z.enum(["text", "textarea", "number", "boolean", "select", "radio", "date", "datetime-local", "checkbox", "tel"]);

const BaseFieldDataSchema = z.object({
  required: z.boolean(),
  label: z.string(),
  attr_name: z.string(),
  locked: z.boolean().optional(),
  locked_text: z.string().optional()
}).strict();


const SelectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
}).strict();

const RadioValue = z.union([z.string(), z.literal("_NOT_SET_"), z.boolean()]).nullable();

const RadioOptionSchema = z.object({
  value: RadioValue,
  label: z.string(),
  checked: z.boolean()
}).strict();

const TextFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string(), z.null()]),
  type: z.enum(["text", "textarea"]),
}).strict();


const PhoneFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string().nullable()]),
  type: z.enum(["tel"])
}).strict();

const RadioFieldSchema = BaseFieldDataSchema.extend({
  value: RadioValue,
  type: z.enum(["radio"]),
  radio_options: z.array(RadioOptionSchema)
}).strict();

const SelectFieldSchema = BaseFieldDataSchema.extend({
  value: z.string().nullable(),
  type: z.enum(["select"]),
  options: z.array(SelectOptionSchema)
}).strict();

const DateFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string(), z.null()]),
  type: z.enum(["date", "datetime-local"])
}).strict();


const CustomFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string(), z.null(), z.boolean(), z.number(), z.array(z.string())]),
  type: FieldType,
  readonly: z.boolean(),
  radio_options: z.array(RadioOptionSchema).optional(),
  options: z.array(SelectOptionSchema).optional()
}).strict();

export const UserProfileSchema = z.object({
  salutation: RadioFieldSchema,
  first_name: TextFieldSchema,
  last_name: TextFieldSchema,
  email: TextFieldSchema,
  phone_number: PhoneFieldSchema,
  company_name: TextFieldSchema,
  address_line_1: TextFieldSchema,
  address_line_2: TextFieldSchema,
  city: TextFieldSchema,
  postal_code: TextFieldSchema,
  country_code: SelectFieldSchema,
  date_of_birth: DateFieldSchema,
  preferred_language: TextFieldSchema.optional(),
  custom_attributes: z.record(z.string(), CustomFieldSchema)
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

type FetchProfileArgs = { idToken: string; lang?: string };
type UpdateProfileArgs = { idToken: string; data: unknown; lang?: string };

export class ProfileService {
  constructor(private client: ApiClient) {}

  async fetchProfile({ idToken, lang }: FetchProfileArgs): Promise<ApiResponse<ProfileResult>> {
    if (!idToken) {
      return { status: 401, success: false, headers: new Headers(), error: "missing id_token" };
    }

    try {
      const resp = await this.client.get<unknown>( `/api/sdk/v1/profile${lang ? `?lang=${lang}` : ""}`, { "X-ID-Token": idToken });

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

  async updateProfile({ idToken, data, lang }: UpdateProfileArgs): Promise<ApiResponse<ProfileResult>> {
    if (!idToken) {
      return { status: 401, success: false, headers: new Headers(), error: "missing id_token" };
    }

    const payload = data as object;

    try {
      const resp = await this.client.patch<unknown>( `/api/sdk/v1/profile${lang ? `?lang=${lang}` : ""}`, { ...payload }, { "X-ID-Token": idToken });

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
