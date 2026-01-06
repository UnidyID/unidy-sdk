import * as z from "zod";
import { BaseErrorSchema } from "../../api/shared";
import { UserProfileSchema } from "../../profile";

// Sign-in status enum
export const SignInStatusEnum = z.enum(["pending_verification", "authenticated", "completed"]);

// Login options for sign-in response
export const LoginOptionsSchema = z.object({
  magic_link: z.boolean(),
  password: z.boolean(),
  social_logins: z.array(z.string()),
  passkey: z.boolean(),
});

// Sign-in creation response
export const CreateSignInResponseSchema = z.object({
  sid: z.string(),
  status: SignInStatusEnum,
  email: z.string(),
  expired: z.boolean(),
  login_options: LoginOptionsSchema,
});

// Generic error response (re-export of base error for backwards compatibility)
export const ErrorSchema = BaseErrorSchema;

// Magic code response
export const SendMagicCodeResponseSchema = z.object({
  enable_resend_after: z.number(),
  sid: z.string().optional(),
});

// Magic code error extends base error with resend timing
export const SendMagicCodeErrorSchema = BaseErrorSchema.extend({
  enable_resend_after: z.number(),
});

// JWT token response
export const TokenResponseSchema = z.object({
  jwt: z.string(),
  sid: z.string().optional(),
});

// Missing required fields response extends base error with specific error_identifier
export const RequiredFieldsResponseSchema = z
  .object({
    error_identifier: z.literal("missing_required_fields"),
    meta: z.object({
      fields: UserProfileSchema.omit({ custom_attributes: true }).partial().extend({
        custom_attributes: UserProfileSchema.shape.custom_attributes?.optional(),
      }),
      sid: z.string().optional(),
    }),
  })
  .transform(({ error_identifier, meta }) => ({
    error_identifier,
    fields: meta.fields,
    sid: meta.sid,
  }));

// Invalid password response with field-level errors
export const InvalidPasswordResponseSchema = z.object({
  error_details: z.object({
    password: z.array(z.string()),
  }),
});

// Passkey authentication options
export const PasskeyOptionsResponseSchema = z.object({
  challenge: z.string(),
  timeout: z.number(),
  rpId: z.string(),
  userVerification: z.string(),
  allowCredentials: z.array(z.any()),
});

// Passkey credential for authentication
export const PasskeyCredentialSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
  }),
  type: z.string(),
});

// Export types
export type SignInStatus = z.infer<typeof SignInStatusEnum>;
export type ErrorResponse = z.infer<typeof ErrorSchema>;
export type LoginOptions = z.infer<typeof LoginOptionsSchema>;
export type CreateSignInResponse = z.infer<typeof CreateSignInResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type SendMagicCodeResponse = z.infer<typeof SendMagicCodeResponseSchema>;
export type RequiredFieldsResponse = z.infer<typeof RequiredFieldsResponseSchema>;
export type SendMagicCodeError = z.infer<typeof SendMagicCodeErrorSchema>;
export type InvalidPasswordResponse = z.infer<typeof InvalidPasswordResponseSchema>;
export type PasskeyOptionsResponse = z.infer<typeof PasskeyOptionsResponseSchema>;
export type PasskeyCredential = z.infer<typeof PasskeyCredentialSchema>;
