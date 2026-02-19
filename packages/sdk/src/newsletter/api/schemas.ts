import * as z from "zod";
import { BaseErrorSchema } from "../../api/shared";

// Salutation enum
export const SalutationEnum = z.enum(["mr", "mrs", "mx"]);

// Newsletter subscription from API
export const NewsletterSubscriptionSchema = z.object({
  id: z.number(),
  email: z.string(),
  newsletter_internal_name: z.string(),
  preference_identifiers: z.array(z.string()),
  preference_token: z.string(),
  confirmed_at: z.string().nullable(),
});

// Newsletter subscription error extends base error with typed meta
export const NewsletterSubscriptionErrorSchema = BaseErrorSchema.extend({
  error_details: z.record(z.string(), z.array(z.string())).optional(),
  meta: z.object({
    newsletter_internal_name: z.string(),
  }),
});

// Create subscriptions response
export const CreateSubscriptionsResponseSchema = z.object({
  results: z.array(NewsletterSubscriptionSchema),
  errors: z.array(NewsletterSubscriptionErrorSchema),
});

// Additional fields for subscription creation - using .partial() for all optional fields
export const AdditionalFieldsSchema = z
  .object({
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    salutation: SalutationEnum.nullable(),
    phone_number: z.string().nullable(),
    date_of_birth: z.string().nullable(),
    company_name: z.string().nullable(),
    address_line_1: z.string().nullable(),
    address_line_2: z.string().nullable(),
    city: z.string().nullable(),
    postal_code: z.string().nullable(),
    country_code: z.string().nullable(),
    preferred_language: z.string().nullable(),
    custom_attributes: z.record(z.string(), z.unknown()).nullable(),
  })
  .partial();

// Create subscriptions payload
export const CreateSubscriptionsPayloadSchema = z.object({
  email: z.string(),
  additional_fields: z.optional(AdditionalFieldsSchema),
  newsletter_subscriptions: z.array(
    z.object({
      newsletter_internal_name: z.string(),
      preference_identifiers: z.optional(z.array(z.string())),
    }),
  ),
  redirect_to_after_confirmation: z.optional(z.string()),
  captcha_token: z.optional(z.string()),
});

// Update subscription payload
export const UpdateSubscriptionPayloadSchema = z.object({
  preference_identifiers: z.array(z.string()),
});

// Login email payload
export const LoginEmailPayloadSchema = z.object({
  email: z.string(),
  redirect_uri: z.string(),
});

// Resend DOI payload
export const ResendDoiPayloadSchema = z
  .object({
    redirect_to_after_confirmation: z.string(),
  })
  .partial();

// Preference schema
export const PreferenceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  plugin_identifier: z.string().nullable(),
  // Backend may return null for legacy rows; normalize to stable defaults.
  position: z
    .number()
    .nullable()
    .transform((value) => value ?? 0),
  default: z
    .boolean()
    .nullable()
    .transform((value) => value ?? false),
  hidden: z.boolean(),
});

// Preference group schema
export const PreferenceGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  // Backend may return null for legacy rows; normalize to stable defaults.
  position: z
    .number()
    .nullable()
    .transform((value) => value ?? 0),
  flat: z.boolean(),
  preferences: z.array(PreferenceSchema),
});

// Newsletter schema
export const NewsletterSchema = z.object({
  id: z.number(),
  internal_name: z.string(),
  default: z.boolean(),
  position: z.number(),
  opt_in_type: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  preference_groups: z.array(PreferenceGroupSchema),
});

// Newsletters list response
export const NewslettersResponseSchema = z.object({
  newsletters: z.array(NewsletterSchema),
});

// Delete subscription response
export const DeleteSubscriptionResponseSchema = z
  .object({
    new_preference_token: z.string(),
  })
  .nullable();

// Generic newsletter error response (extends base error)
export const NewsletterErrorResponseSchema = BaseErrorSchema;

// Export types
export type Salutation = z.infer<typeof SalutationEnum>;
export type NewsletterSubscription = z.infer<typeof NewsletterSubscriptionSchema>;
export type NewsletterSubscriptionError = z.infer<typeof NewsletterSubscriptionErrorSchema>;
export type CreateSubscriptionsResponse = z.infer<typeof CreateSubscriptionsResponseSchema>;
export type CreateSubscriptionsPayload = z.infer<typeof CreateSubscriptionsPayloadSchema>;
export type AdditionalFields = z.infer<typeof AdditionalFieldsSchema>;
export type UpdateSubscriptionPayload = z.infer<typeof UpdateSubscriptionPayloadSchema>;
export type LoginEmailPayload = z.infer<typeof LoginEmailPayloadSchema>;
export type ResendDoiPayload = z.infer<typeof ResendDoiPayloadSchema>;
export type Newsletter = z.infer<typeof NewsletterSchema>;
export type NewslettersResponse = z.infer<typeof NewslettersResponseSchema>;
export type Preference = z.infer<typeof PreferenceSchema>;
export type PreferenceGroup = z.infer<typeof PreferenceGroupSchema>;
export type NewsletterErrorResponse = z.infer<typeof NewsletterErrorResponseSchema>;
