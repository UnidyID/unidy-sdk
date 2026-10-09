import * as z from "zod";

// Sign-in's missing_required_fields still renders each field with its value and form metadata, as the
// SDK V1 profile did. The radio fields are parsed into the profile store's shape: `options` without the
// `checked` flag, and `null` where V1 marks "not set" as `_NOT_SET_`.

const NOT_SET = "_NOT_SET_";

const FieldTypeEnum = z.enum(["text", "textarea", "number", "boolean", "select", "radio", "date", "datetime-local", "checkbox", "tel"]);

const BaseFieldDataSchema = z
  .object({
    required: z.boolean(),
    label: z.string(),
    attr_name: z.string(),
    locked: z.boolean().optional(),
    locked_text: z.string().nullish(),
  })
  .strict();

const SelectOptionSchema = z
  .object({
    value: z.string(),
    label: z.string(),
  })
  .strict();

const RadioValue = z
  .union([z.string(), z.boolean()])
  .nullable()
  .transform((value) => (value === NOT_SET ? null : value));

const RadioOptionsSchema = z.array(
  z
    .object({
      value: RadioValue,
      label: z.string(),
      checked: z.boolean(),
    })
    .strict()
    .transform(({ value, label }) => ({ value, label })),
);

const TextFieldSchema = BaseFieldDataSchema.extend({
  value: z.string().nullable(),
  type: z.enum(["text", "textarea"]),
}).strict();

const PhoneFieldSchema = BaseFieldDataSchema.extend({
  value: z.string().nullable(),
  type: z.literal("tel"),
}).strict();

const RadioFieldSchema = BaseFieldDataSchema.extend({
  value: RadioValue,
  type: z.literal("radio"),
  radio_options: RadioOptionsSchema,
})
  .strict()
  .transform(({ radio_options, ...field }) => ({ ...field, options: radio_options }));

const SelectFieldSchema = BaseFieldDataSchema.extend({
  value: z.string().nullable(),
  type: z.literal("select"),
  options: z.array(SelectOptionSchema),
}).strict();

const DateFieldSchema = BaseFieldDataSchema.extend({
  value: z.string().nullable(),
  type: z.enum(["date", "datetime-local"]),
}).strict();

const CustomFieldSchema = BaseFieldDataSchema.extend({
  value: z
    .union([z.string(), z.boolean(), z.number(), z.array(z.string())])
    .nullable()
    .transform((value) => (value === NOT_SET ? null : value)),
  type: FieldTypeEnum,
  readonly: z.boolean(),
  radio_options: RadioOptionsSchema.optional(),
  options: z.array(SelectOptionSchema).optional(),
})
  .strict()
  .transform(({ radio_options, ...field }) => (radio_options ? { ...field, options: radio_options } : field));

/** The fields a sign-in still needs, each with its value and form metadata. */
export const SignInProfileFieldsSchema = z.object({
  salutation: RadioFieldSchema.optional(),
  first_name: TextFieldSchema.optional(),
  last_name: TextFieldSchema.optional(),
  email: TextFieldSchema.optional(),
  phone_number: PhoneFieldSchema.optional(),
  company_name: TextFieldSchema.optional(),
  address_line_1: TextFieldSchema.optional(),
  address_line_2: TextFieldSchema.optional(),
  city: TextFieldSchema.optional(),
  postal_code: TextFieldSchema.optional(),
  country_code: SelectFieldSchema.optional(),
  date_of_birth: DateFieldSchema.optional(),
  preferred_language: TextFieldSchema.optional(),
  custom_attributes: z.record(z.string(), CustomFieldSchema).optional(),
});

export type SignInProfileFields = z.infer<typeof SignInProfileFieldsSchema>;
