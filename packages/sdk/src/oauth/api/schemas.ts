import * as z from "zod";
import { BaseErrorSchema } from "../../api/shared";

// OAuth Application scope with translation
export const OAuthScopeSchema = z.object({
  scope: z.string(),
  name: z.string(),
});

// OAuth Application info
export const OAuthApplicationSchema = z.object({
  uid: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  scopes: z.array(OAuthScopeSchema),
  logo_url: z.string().nullable(),
  connect_uri: z.string().nullable(),
});

// Check consent response
export const CheckConsentResponseSchema = z.object({
  has_consent: z.boolean(),
  required_fields: z.array(z.string()),
  missing_fields: z.array(z.string()),
  application: OAuthApplicationSchema,
});

// Check consent response with error (from connect endpoint)
export const CheckConsentWithErrorResponseSchema = CheckConsentResponseSchema.extend({
  error_identifier: z.string(),
  error_details: z.record(z.string(), z.unknown()).optional(),
});

// Grant consent / Connect response (returns token)
export const OAuthTokenResponseSchema = z.object({
  token: z.string(),
});

// Error responses
export const OAuthErrorSchema = BaseErrorSchema.extend({
  error_details: z.record(z.string(), z.unknown()).optional(),
});

export const ConsentNotGrantedErrorSchema = BaseErrorSchema.extend({
  error_identifier: z.literal("consent_not_granted"),
  error_details: z.object({
    reason: z.string(),
  }),
});

export const MissingFieldsErrorSchema = BaseErrorSchema.extend({
  error_identifier: z.literal("missing_required_fields"),
  error_details: z.object({
    missing_fields: z.array(z.string()),
  }),
});

// Request schemas
export const UpdateConsentRequestSchema = z.object({
  user_updates: z
    .object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      custom_attributes: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export const GrantConsentRequestSchema = z.object({
  scopes: z.array(z.string()).optional(),
  redirect_uri: z.string().optional(),
});

export const ConnectRequestSchema = z.object({
  scopes: z.array(z.string()).optional(),
  redirect_uri: z.string().optional(),
});

// Type exports
export type OAuthScope = z.infer<typeof OAuthScopeSchema>;
export type OAuthApplication = z.infer<typeof OAuthApplicationSchema>;
export type CheckConsentResponse = z.infer<typeof CheckConsentResponseSchema>;
export type CheckConsentWithErrorResponse = z.infer<typeof CheckConsentWithErrorResponseSchema>;
export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>;
export type OAuthError = z.infer<typeof OAuthErrorSchema>;
export type UpdateConsentRequest = z.infer<typeof UpdateConsentRequestSchema>;
export type GrantConsentRequest = z.infer<typeof GrantConsentRequestSchema>;
export type ConnectRequest = z.infer<typeof ConnectRequestSchema>;
