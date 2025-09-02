import type { ApiClient, ApiResponse } from "./api_client";
import * as z from "zod";

const FieldType = z.enum(["text", "textarea", "number", "boolean", "select", "radio", "date", "datetime-local", "checkbox"]);

const LockedSchema = z.object({
  locked: z.boolean(),
  locked_text: z.union([z.string(), z.null()]).optional()
})

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
  locked: LockedSchema.optional(),
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
  custom_attributes: z.record(z.string(), FieldSchema)
})

const UserProfileErrorSchema = z.object({
  error_identifier: z.string()
});

const UserProfileFormErrorSchema = z.object({
  errors: z.record(
    z.string(),
    z.union([
      z.array(z.string()),
      z.array(z.tuple([z.number(), z.array(z.string())]))
    ])
  )
});

const ProfileResultSchema = z.union([UserProfileSchema, UserProfileErrorSchema, UserProfileFormErrorSchema]);

export type UserProfileData = z.infer<typeof UserProfileSchema>;
export type UserProfileError = z.infer<typeof UserProfileErrorSchema>;
export type UserProfileFormError = z.infer<typeof UserProfileFormErrorSchema>;
export type ProfileResult = z.infer<typeof ProfileResultSchema>;

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
      const resp = await this.client.get<UserProfileData>("/api/sdk/v1/profile", { "X-ID-Token": token });
      if (resp.status === 200) {
        const validatedData = UserProfileSchema.parse(resp.data);
        return { ...resp, data: validatedData };
      }else {
        const validatedError = UserProfileErrorSchema.parse(resp.data);
        return { ...resp, data: validatedError, error: validatedError.error_identifier } as ApiResponse<UserProfileError>;
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        return {
          status: 400,
          success: false,
          headers: new Headers(),
          error: "invalid profile data",
        };
      }
      return {
        status: e instanceof TypeError ? 0 : 500,
        success: false,
        headers: new Headers(),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async updateProfile(idToken: string, data: unknown): Promise<ApiResponse<ProfileResult>> {
    const token = idToken;
    if (!token) {
      return { status: 401, success: false, headers: new Headers(), error: "missing id_token" };
    }
    try {
      const resp = await this.client.patch<UserProfileData>("/api/sdk/v1/profile", { ...data as object }, { "X-ID-Token": token });
      if (resp.status === 200) {
        const validatedData = UserProfileSchema.parse(resp.data);
        return { ...resp, data: validatedData };
      }else {
        try {
          const validatedError = UserProfileErrorSchema.parse(resp.data);
          return { ...resp, data: validatedError, error: validatedError.error_identifier } as ApiResponse<UserProfileError>;
        }catch{
          const validatedFormError = UserProfileFormErrorSchema.parse(resp.data);
          const flat: Record<string, string> = Object.fromEntries(
            Object.entries(validatedFormError.errors).map(([field, errors]) => {
              if (Array.isArray(errors) && errors.length > 0 && typeof errors[0] === "string") {
                return [field, (errors as string[]).join(" | ")];
              } else {
                const tuples = errors as Array<[number, string[]]>;
              return [field, tuples.flatMap(([, msgs]) => msgs).join(" | ")];
            }
          })
        );
        return { ...resp, data: validatedFormError, flatErrors: flat }  as ApiResponse<UserProfileFormError> & { flatErrors: Record<string, string> };
      }
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        return {
          status: 400,
          success: false,
          headers: new Headers(),
          error: "invalid profile data",
        };
      }
      return {
        status: e instanceof TypeError ? 0 : 500,
        success: false,
        headers: new Headers(),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
