import * as z from "zod";
import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies } from "../../api";

const FieldType = z.enum(["text", "textarea", "number", "boolean", "select", "radio", "date", "datetime-local", "checkbox", "tel"]);

const BaseFieldDataSchema = z
  .object({
    required: z.boolean(),
    label: z.string(),
    attr_name: z.string(),
    locked: z.boolean().optional(),
    locked_text: z.string().optional(),
  })
  .strict();

const SelectOptionSchema = z
  .object({
    value: z.string(),
    label: z.string(),
  })
  .strict();

const RadioValue = z.union([z.string(), z.literal("_NOT_SET_"), z.boolean()]).nullable();

const RadioOptionSchema = z
  .object({
    value: RadioValue,
    label: z.string(),
    checked: z.boolean(),
  })
  .strict();

const TextFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string(), z.null()]),
  type: z.enum(["text", "textarea"]),
}).strict();

const PhoneFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string().nullable()]),
  type: z.enum(["tel"]),
}).strict();

const RadioFieldSchema = BaseFieldDataSchema.extend({
  value: RadioValue,
  type: z.enum(["radio"]),
  radio_options: z.array(RadioOptionSchema),
}).strict();

const SelectFieldSchema = BaseFieldDataSchema.extend({
  value: z.string().nullable(),
  type: z.enum(["select"]),
  options: z.array(SelectOptionSchema),
}).strict();

const DateFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string(), z.null()]),
  type: z.enum(["date", "datetime-local"]),
}).strict();

const CustomFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string(), z.null(), z.boolean(), z.number(), z.array(z.string())]),
  type: FieldType,
  readonly: z.boolean(),
  radio_options: z.array(RadioOptionSchema).optional(),
  options: z.array(SelectOptionSchema).optional(),
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
  custom_attributes: z.record(z.string(), CustomFieldSchema),
});

const ProfileErrorResponseSchema = z
  .object({
    error_identifier: z.string(),
  })
  .strict();

const FormErrorsValue = z.union([z.array(z.string()), z.array(z.tuple([z.number(), z.array(z.string())]))]);

const FormErrorsRawSchema = z.record(z.string(), FormErrorsValue);

const UserProfileFormErrorSchema = z
  .object({
    errors: FormErrorsRawSchema,
  })
  .strict()
  .transform(({ errors }) => {
    const flatErrors = Object.fromEntries(
      Object.entries(errors).map(([field, value]) => {
        const errorMessages =
          Array.isArray(value) && value.length > 0 && typeof value[0] === "string"
            ? (value as string[])
            : (value as Array<[number, string[]]>).flatMap(([, arr]) => arr);
        return [field, errorMessages.join(" | ")];
      }),
    );
    return { errors, flatErrors };
  });

export type UserProfileData = z.infer<typeof UserProfileSchema>;
export type ProfileErrorResponse = z.infer<typeof ProfileErrorResponseSchema>;
export type UserProfileFormError = z.infer<typeof UserProfileFormErrorSchema>;

declare global {
  interface Window {
    UNIDY?: { auth?: { id_token?: string } };
  }
}

type FetchProfileArgs = { idToken: string; lang?: string };
type UpdateProfileArgs = { idToken: string; data: unknown; lang?: string };

// Result types using tuples
export type FetchProfileResult =
  | CommonErrors
  | ["missing_id_token", null]
  | ["unauthorized", ProfileErrorResponse]
  | ["invalid_profile_data", null]
  | [null, UserProfileData];

export type UpdateProfileResult =
  | CommonErrors
  | ["missing_id_token", null]
  | ["unauthorized", ProfileErrorResponse]
  | ["invalid_profile_data", null]
  | ["validation_error", UserProfileFormError]
  | [null, UserProfileData];

export class ProfileService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "ProfileService", deps);
  }

  async fetchProfile({ idToken, lang }: FetchProfileArgs): Promise<FetchProfileResult> {
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const response = await this.client.get<unknown>(
      `/api/sdk/v1/profile${lang ? `?lang=${lang}` : ""}`,
      this.buildAuthHeaders({ "X-ID-Token": idToken }),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error = ProfileErrorResponseSchema.safeParse(response.data);
        if (error.success) {
          if (response.status === 401) {
            return ["unauthorized", error.data];
          }
          throw new Error(`Unexpected error: ${error.data.error_identifier}`);
        }
        throw new Error("Failed to parse error response");
      }

      const parsed = UserProfileSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid profile data", parsed.error);
        return ["invalid_profile_data", null];
      }

      return [null, parsed.data];
    });
  }

  async updateProfile({ idToken, data, lang }: UpdateProfileArgs): Promise<UpdateProfileResult> {
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const payload = data as object;

    const response = await this.client.patch<unknown>(
      `/api/sdk/v1/profile${lang ? `?lang=${lang}` : ""}`,
      { ...payload },
      this.buildAuthHeaders({ "X-ID-Token": idToken }),
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        // Check for form validation errors first
        const formErrors = UserProfileFormErrorSchema.safeParse(response.data);
        if (formErrors.success) {
          return ["validation_error", formErrors.data];
        }

        // Check for API error response
        const error = ProfileErrorResponseSchema.safeParse(response.data);
        if (error.success) {
          if (response.status === 401) {
            return ["unauthorized", error.data];
          }
          throw new Error(`Unexpected error: ${error.data.error_identifier}`);
        }

        throw new Error("Failed to parse error response");
      }

      const parsed = UserProfileSchema.safeParse(response.data);
      if (!parsed.success) {
        this.logger.error("Invalid profile data", parsed.error);
        return ["invalid_profile_data", null];
      }

      return [null, parsed.data];
    });
  }
}
