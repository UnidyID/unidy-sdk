import type { ApiClient, ApiResponse } from "./api_client";
import * as z from "zod";

const FieldType = z.enum(["text", "textarea", "number", "boolean", "select", "radio", "date", "datetime-local"]);

const LockedSchema = z.object({
  locked: z.boolean(),
  locked_text: z.string(),
}).strict();

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
  value: z.union([z.string(), z.null(), z.boolean()]),
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

declare global {
  interface Window {
    UNIDY?: { auth?: { id_token?: string } };
  }
}

export class ProfileService {
  constructor(private client: ApiClient) {}
  async fetchProfile(idToken?: string): Promise<ApiResponse<unknown>> {
    const token = idToken ?? window.UNIDY?.auth?.id_token;
    if (!token) {
      return { status: 401, success: false, headers: new Headers(), error: "missing id_token" };
    }
    try {
      const resp = await this.client.post<unknown>("/api/sdk/v1/profile", { id_token: token });
      const validatedData = UserProfileSchema.parse(resp.data);

      return { ...resp, data: validatedData };

    } catch (e) {
      if (e instanceof z.ZodError) {
        return {
          status: 400,
          success: false,
          headers: new Headers(),
          error: `invalid profile data`,
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

  async updateProfile(idToken: string, data: unknown): Promise<ApiResponse<unknown>> {
    const token = idToken;
    if (!token) {
      return { status: 401, success: false, headers: new Headers(), error: "missing id_token" };
    }
    try {
  return await this.client.patch<unknown>("/api/sdk/v1/profile", { id_token: token, ...data as object });
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
