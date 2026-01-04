import * as z from "zod";

// Field type enum
export const FieldType = z.enum(["text", "textarea", "number", "boolean", "select", "radio", "date", "datetime-local", "checkbox", "tel"]);

// Base field data schema
export const BaseFieldDataSchema = z
  .object({
    required: z.boolean(),
    label: z.string(),
    attr_name: z.string(),
    locked: z.boolean().optional(),
    locked_text: z.string().optional(),
  })
  .strict();

// Select option schema
export const SelectOptionSchema = z
  .object({
    value: z.string(),
    label: z.string(),
  })
  .strict();

// Radio value type
export const RadioValue = z.union([z.string(), z.literal("_NOT_SET_"), z.boolean()]).nullable();

// Radio option schema
export const RadioOptionSchema = z
  .object({
    value: RadioValue,
    label: z.string(),
    checked: z.boolean(),
  })
  .strict();

// Text field schema
export const TextFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string(), z.null()]),
  type: z.enum(["text", "textarea"]),
}).strict();

// Phone field schema
export const PhoneFieldSchema = BaseFieldDataSchema.extend({
  value: z.string().nullable(),
  type: z.enum(["tel"]),
}).strict();

// Radio field schema
export const RadioFieldSchema = BaseFieldDataSchema.extend({
  value: RadioValue,
  type: z.enum(["radio"]),
  radio_options: z.array(RadioOptionSchema),
}).strict();

// Select field schema
export const SelectFieldSchema = BaseFieldDataSchema.extend({
  value: z.string().nullable(),
  type: z.enum(["select"]),
  options: z.array(SelectOptionSchema),
}).strict();

// Date field schema
export const DateFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string(), z.null()]),
  type: z.enum(["date", "datetime-local"]),
}).strict();

// Custom field schema
export const CustomFieldSchema = BaseFieldDataSchema.extend({
  value: z.union([z.string(), z.null(), z.boolean(), z.number(), z.array(z.string())]),
  type: FieldType,
  readonly: z.boolean(),
  radio_options: z.array(RadioOptionSchema).optional(),
  options: z.array(SelectOptionSchema).optional(),
}).strict();

// User profile schema
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

// Profile error response schema
export const ProfileErrorResponseSchema = z
  .object({
    error_identifier: z.string(),
  })
  .strict();

// Form errors value type
export const FormErrorsValue = z.union([z.array(z.string()), z.array(z.tuple([z.number(), z.array(z.string())]))]);

// Form errors raw schema
export const FormErrorsRawSchema = z.record(z.string(), FormErrorsValue);

// User profile form error schema with transformation
export const UserProfileFormErrorSchema = z
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

// Export types
export type UserProfileData = z.infer<typeof UserProfileSchema>;
export type ProfileErrorResponse = z.infer<typeof ProfileErrorResponseSchema>;
export type UserProfileFormError = z.infer<typeof UserProfileFormErrorSchema>;

// Global window type declaration
declare global {
  interface Window {
    UNIDY?: { auth?: { id_token?: string } };
  }
}

// Function argument types
export type FetchProfileArgs = { idToken: string; lang?: string };
export type UpdateProfileArgs = { idToken: string; data: unknown; lang?: string };
