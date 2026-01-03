import * as z from "zod";

// Newsletter subscription from API
export const NewsletterSubscriptionSchema = z.object({
  id: z.number(),
  email: z.string(),
  newsletter_internal_name: z.string(),
  preference_identifiers: z.array(z.string()),
  preference_token: z.string(),
  confirmed_at: z.union([z.string(), z.null()]),
});

// Newsletter subscription error with meta info
export const NewsletterSubscriptionErrorSchema = z.object({
  error_identifier: z.string(),
  error_details: z.optional(z.record(z.string(), z.array(z.string()))),
  meta: z.object({
    newsletter_internal_name: z.string(),
  }),
});

// Create subscriptions response
export const CreateSubscriptionsResponseSchema = z.object({
  results: z.array(NewsletterSubscriptionSchema),
  errors: z.array(NewsletterSubscriptionErrorSchema),
});

// Additional fields for subscription creation
export const AdditionalFieldsSchema = z.object({
  first_name: z.optional(z.union([z.string(), z.null()])),
  last_name: z.optional(z.union([z.string(), z.null()])),
  salutation: z.optional(z.union([z.literal("mr"), z.literal("mrs"), z.literal("mx"), z.null()])),
  phone_number: z.optional(z.union([z.string(), z.null()])),
  date_of_birth: z.optional(z.union([z.string(), z.null()])),
  company_name: z.optional(z.union([z.string(), z.null()])),
  address_line_1: z.optional(z.union([z.string(), z.null()])),
  address_line_2: z.optional(z.union([z.string(), z.null()])),
  city: z.optional(z.union([z.string(), z.null()])),
  postal_code: z.optional(z.union([z.string(), z.null()])),
  country_code: z.optional(z.union([z.string(), z.null()])),
  preferred_language: z.optional(z.union([z.string(), z.null()])),
  custom_attributes: z.optional(z.union([z.record(z.string(), z.unknown()), z.null()])),
});

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
export const ResendDoiPayloadSchema = z.object({
  redirect_to_after_confirmation: z.optional(z.string()),
});

// Preference schema
export const PreferenceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.union([z.string(), z.null()]),
  plugin_identifier: z.union([z.string(), z.null()]),
  position: z.number(),
  default: z.boolean(),
  hidden: z.boolean(),
});

// Preference group schema
export const PreferenceGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  position: z.number(),
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
  description: z.union([z.string(), z.null()]),
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

// Generic newsletter error response
export const NewsletterErrorResponseSchema = z.object({
  error_identifier: z.string(),
});

// Export types
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

// Auth options for subscription requests
export type SubscriptionAuthOptions = {
  idToken?: string;
  preferenceToken?: string;
};
