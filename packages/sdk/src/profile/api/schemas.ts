import * as z from "zod";

/** A custom attribute's value as `GET /api/v2/me` renders it; a multi-select holds the selected values. */
export const CustomAttributeValueSchema = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).nullable();

/** The signed-in user (`GET /api/v2/me`). */
export const MeUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  salutation: z.string().nullable(),
  gender: z.string().nullable(),
  /** `YYYY-MM-DD` */
  date_of_birth: z.string().nullable(),
  phone_number: z.string().nullable(),
  address_line_1: z.string().nullable(),
  address_line_2: z.string().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable(),
  country_code: z.string().nullable(),
  company_name: z.string().nullable(),
  preferred_language: z.string().nullable(),
  verified: z.boolean(),
  /** Names of the brands the user belongs to. */
  brands: z.array(z.string()),
  confirmed_at: z.string().nullable(),
  verified_at: z.string().nullable(),
  invitation_created_at: z.string().nullable(),
  invitation_sent_at: z.string().nullable(),
  invitation_accepted_at: z.string().nullable(),
  disabled: z.boolean(),
  disabled_at: z.string().nullable(),
  /** The custom attributes the user may read, by name. */
  custom_attributes: z.record(z.string(), CustomAttributeValueSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Input types of the profile form fields. `checkbox` is a multi-select. */
export const ProfileFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "number",
  "select",
  "radio",
  "date",
  "datetime-local",
  "checkbox",
  "tel",
]);

/** A choice of a select, radio or multi-select field. A yes/no radio offers `true`, `false` and `null` (not set). */
export const ProfileFieldOptionSchema = z.object({
  value: z.union([z.string(), z.boolean()]).nullable(),
  label: z.string(),
});

/** The brand owning a custom attribute definition; not strict so the backend can add keys without breaking parsing. */
export const AttributeBrandSchema = z.object({
  id: z.number(),
  name: z.string(),
  display_name: z.string(),
});

/** One field of the profile form (`GET /api/v2/me/user_attributes`); its value is on the user under `name`. */
export const ProfileFieldSchema = z
  .object({
    name: z.string(),
    /** Whether the value is under `custom_attributes` rather than on the user itself. */
    custom_attribute: z.boolean(),
    type: ProfileFieldTypeSchema,
    label: z.string(),
    required: z.boolean(),
    /** `show` lets the profile display the field without the user changing it. */
    profile_access: z.enum(["edit", "show", "hidden"]),
    /** A filled field the brand locked; the user can no longer change it. */
    locked: z.boolean(),
    /** Why the field is locked, or will be once it is filled. */
    locked_text: z.string().nullable(),
    options: z.array(ProfileFieldOptionSchema).nullable(),
  })
  .transform((field) => ({ ...field, readonly: field.profile_access === "show" }));

export type AttributeBrand = z.infer<typeof AttributeBrandSchema>;
export type CustomAttributeValue = z.infer<typeof CustomAttributeValueSchema>;
export type MeUser = z.infer<typeof MeUserSchema>;
export type ProfileFieldType = z.infer<typeof ProfileFieldTypeSchema>;
export type ProfileFieldOption = z.infer<typeof ProfileFieldOptionSchema>;
export type ProfileField = z.infer<typeof ProfileFieldSchema>;

/** The profile fields `PATCH /api/v2/me` writes. A `null` value clears the field, and deletes a custom attribute. */
export type MeUserUpdate = Partial<
  Pick<
    MeUser,
    | "first_name"
    | "last_name"
    | "salutation"
    | "phone_number"
    | "date_of_birth"
    | "company_name"
    | "address_line_1"
    | "address_line_2"
    | "city"
    | "postal_code"
    | "country_code"
    | "preferred_language"
  >
> & { custom_attributes?: Record<string, CustomAttributeValue> };

// Global window type declaration
declare global {
  interface Window {
    UNIDY?: { auth?: { id_token?: string } };
  }
}
