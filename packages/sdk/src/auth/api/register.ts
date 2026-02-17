import * as z from "zod";

import type { ApiClientInterface } from "../../api/base-service";
import { type ErrorResponse, ErrorSchema } from "./schemas";
import type { CommonErrors, HandleResponseFn } from "./shared";
import { withRid } from "./shared";

// Registration profile data schema (matches backend REGISTRATION_PROFILE_DATA)
const RegistrationProfileDataSchema = z
  .object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    date_of_birth: z.string().optional(),
    phone: z.string().optional(),
    locale: z.string().optional(),
    salutation: z.string().optional(),
    title: z.string().optional(),
    gender: z.string().optional(),
    custom_attributes: z.record(z.string(), z.unknown()).optional(),
    _clear: z
      .object({
        first_name: z.boolean().optional(),
        last_name: z.boolean().optional(),
        date_of_birth: z.boolean().optional(),
        phone: z.boolean().optional(),
        locale: z.boolean().optional(),
        salutation: z.boolean().optional(),
        title: z.boolean().optional(),
        gender: z.boolean().optional(),
        custom_attributes: z.boolean().optional(),
      })
      .optional(),
  })
  .passthrough();

// Newsletter preferences schema
const NewsletterPreferencesSchema = z
  .object({
    _clear: z.record(z.string(), z.boolean()).optional(),
  })
  .catchall(z.array(z.string()));

// Registration flow response schema (from Sdk::RegistrationFlowSerializer)
const RegistrationFlowResponseSchema = z.object({
  rid: z.string(),
  email: z.string().nullable(),
  newsletter_preferences: z.record(z.string(), z.array(z.string())).nullable(),
  registration_profile_data: z.record(z.string(), z.unknown()).nullable(),
  social_provider: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  expires_at: z.string(),
  has_password: z.boolean().nullable(),
  expired: z.boolean(),
  can_finalize: z.boolean(),
  email_verified: z.boolean(),
});

// Create registration payload schema
const CreateRegistrationPayloadSchema = z.object({
  registration_url: z.string(),
  brand_id: z.number().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  passwordless_flag: z.boolean().optional(),
  registration_profile_data: RegistrationProfileDataSchema.optional(),
  newsletter_preferences: NewsletterPreferencesSchema.optional(),
});

// Update registration payload schema
const UpdateRegistrationPayloadSchema = z.object({
  email: z.string().optional(),
  password: z.string().optional(),
  passwordless_flag: z.boolean().optional(),
  registration_profile_data: RegistrationProfileDataSchema.optional(),
  newsletter_preferences: NewsletterPreferencesSchema.optional(),
});

// Send verification code response schema
const SendVerificationCodeResponseSchema = z.object({
  success: z.boolean(),
  enable_resend_after: z.number(),
});

// Verify email payload schema
const VerifyEmailPayloadSchema = z.object({
  code: z.string(),
});

// Send resume link payload schema
const SendResumeLinkPayloadSchema = z.object({
  email: z.string(),
});

// Cannot finalize error schema
const CannotFinalizeErrorSchema = z.object({
  error: z.literal("cannot_finalize"),
  missing_fields: z.array(z.string()).optional(),
  email_missing: z.boolean().optional(),
  auth_method_missing: z.boolean().optional(),
});

// Exported types
export type RegistrationProfileData = z.infer<typeof RegistrationProfileDataSchema>;
export type NewsletterPreferences = z.infer<typeof NewsletterPreferencesSchema>;
export type RegistrationFlowResponse = z.infer<typeof RegistrationFlowResponseSchema>;
export type CreateRegistrationPayload = z.infer<typeof CreateRegistrationPayloadSchema>;
export type UpdateRegistrationPayload = z.infer<typeof UpdateRegistrationPayloadSchema>;
export type SendVerificationCodeResponse = z.infer<typeof SendVerificationCodeResponseSchema>;
export type VerifyEmailPayload = z.infer<typeof VerifyEmailPayloadSchema>;
export type SendResumeLinkPayload = z.infer<typeof SendResumeLinkPayloadSchema>;
export type CannotFinalizeError = z.infer<typeof CannotFinalizeErrorSchema>;

/** Safely parse error response, returning a fallback if parsing fails */
function parseErrorResponse(data: unknown): ErrorResponse {
  const parsed = ErrorSchema.safeParse(data);
  return parsed.success ? parsed.data : { error_identifier: "unknown_error" };
}

// Options type for registration methods (optional rid parameter)
export type RegistrationOptions = {
  rid?: string;
};

// Result types
export type CreateRegistrationResult =
  | CommonErrors
  | ["email_already_registered", ErrorResponse]
  | ["registration_flow_already_exists", ErrorResponse]
  | ["invalid_record", ErrorResponse]
  | [null, RegistrationFlowResponse];

export type GetRegistrationResult =
  | CommonErrors
  | ["registration_not_found", ErrorResponse]
  | ["registration_expired", ErrorResponse]
  | [null, RegistrationFlowResponse];

export type UpdateRegistrationResult =
  | CommonErrors
  | ["registration_not_found", ErrorResponse]
  | ["registration_expired", ErrorResponse]
  | ["invalid_record", ErrorResponse]
  | [null, RegistrationFlowResponse];

export type CancelRegistrationResult =
  | CommonErrors
  | ["registration_not_found", ErrorResponse]
  | ["registration_expired", ErrorResponse]
  | [null, null];

export type FinalizeRegistrationResult =
  | CommonErrors
  | ["registration_not_found", ErrorResponse]
  | ["registration_expired", ErrorResponse]
  | ["cannot_finalize", CannotFinalizeError]
  | ["email_already_registered", ErrorResponse]
  | [null, RegistrationFlowResponse];

export type SendVerificationCodeResult =
  | CommonErrors
  | ["registration_not_found", ErrorResponse]
  | ["registration_expired", ErrorResponse]
  | ["verification_code_recently_sent", ErrorResponse]
  | [null, SendVerificationCodeResponse];

export type VerifyEmailResult =
  | CommonErrors
  | ["registration_not_found", ErrorResponse]
  | ["registration_expired", ErrorResponse]
  | ["invalid_code", ErrorResponse]
  | ["code_expired", ErrorResponse]
  | [null, RegistrationFlowResponse];

export type SendResumeLinkResult =
  | CommonErrors
  | ["email_required", ErrorResponse]
  | ["registration_flow_not_found", ErrorResponse]
  | [null, null];

// Registration API functions

/**
 * Create a new registration flow.
 */
export async function createRegistration(
  client: ApiClientInterface,
  payload: CreateRegistrationPayload,
  handleResponse: HandleResponseFn,
): Promise<CreateRegistrationResult> {
  const response = await client.post<RegistrationFlowResponse>("/api/sdk/v1/registration", payload);

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as "email_already_registered" | "registration_flow_already_exists" | "invalid_record",
        error_response,
      ];
    }

    return [null, RegistrationFlowResponseSchema.parse(response.data)];
  });
}

/**
 * Get the current registration flow.
 * Uses rid from cookie by default, or pass rid in options.
 */
export async function getRegistration(
  client: ApiClientInterface,
  options: RegistrationOptions | undefined,
  handleResponse: HandleResponseFn,
): Promise<GetRegistrationResult> {
  const endpoint = withRid(client.baseUrl, "/api/sdk/v1/registration", options?.rid);
  const response = await client.get<RegistrationFlowResponse>(endpoint);

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "registration_not_found" | "registration_expired", error_response];
    }

    return [null, RegistrationFlowResponseSchema.parse(response.data)];
  });
}

/**
 * Update the current registration flow.
 * Uses rid from cookie by default, or pass rid in options.
 */
export async function updateRegistration(
  client: ApiClientInterface,
  payload: UpdateRegistrationPayload,
  options: RegistrationOptions | undefined,
  handleResponse: HandleResponseFn,
): Promise<UpdateRegistrationResult> {
  const endpoint = withRid(client.baseUrl, "/api/sdk/v1/registration", options?.rid);
  const response = await client.patch<RegistrationFlowResponse>(endpoint, payload);

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as "registration_not_found" | "registration_expired" | "invalid_record",
        error_response,
      ];
    }

    return [null, RegistrationFlowResponseSchema.parse(response.data)];
  });
}

/**
 * Cancel (delete) the current registration flow.
 * Uses rid from cookie by default, or pass rid in options.
 */
export async function cancelRegistration(
  client: ApiClientInterface,
  options: RegistrationOptions | undefined,
  handleResponse: HandleResponseFn,
): Promise<CancelRegistrationResult> {
  const endpoint = withRid(client.baseUrl, "/api/sdk/v1/registration", options?.rid);
  const response = await client.delete<{ success: boolean }>(endpoint);

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "registration_not_found" | "registration_expired", error_response];
    }

    return [null, null];
  });
}

/**
 * Finalize the registration flow and create the user.
 * Uses rid from cookie by default, or pass rid in options.
 */
export async function finalizeRegistration(
  client: ApiClientInterface,
  options: RegistrationOptions | undefined,
  handleResponse: HandleResponseFn,
): Promise<FinalizeRegistrationResult> {
  const endpoint = withRid(client.baseUrl, "/api/sdk/v1/registration/finalize", options?.rid);
  const response = await client.post<RegistrationFlowResponse>(endpoint, {});

  return handleResponse(response, () => {
    if (!response.success) {
      // Check for cannot_finalize error with additional details
      const cannotFinalizeCheck = CannotFinalizeErrorSchema.safeParse(response.data);
      if (cannotFinalizeCheck.success) {
        return ["cannot_finalize", cannotFinalizeCheck.data];
      }

      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as "registration_not_found" | "registration_expired" | "email_already_registered",
        error_response,
      ];
    }

    return [null, RegistrationFlowResponseSchema.parse(response.data)];
  });
}

/**
 * Send email verification code.
 * Uses rid from cookie by default, or pass rid in options.
 */
export async function sendEmailVerificationCode(
  client: ApiClientInterface,
  options: RegistrationOptions | undefined,
  handleResponse: HandleResponseFn,
): Promise<SendVerificationCodeResult> {
  const endpoint = withRid(client.baseUrl, "/api/sdk/v1/registration/email_verification/send_code", options?.rid);
  const response = await client.post<SendVerificationCodeResponse>(endpoint, {});

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as "registration_not_found" | "registration_expired" | "verification_code_recently_sent",
        error_response,
      ];
    }

    return [null, SendVerificationCodeResponseSchema.parse(response.data)];
  });
}

/**
 * Verify email with the code sent to the user.
 * Uses rid from cookie by default, or pass rid in options.
 */
export async function verifyEmail(
  client: ApiClientInterface,
  payload: VerifyEmailPayload,
  options: RegistrationOptions | undefined,
  handleResponse: HandleResponseFn,
): Promise<VerifyEmailResult> {
  const endpoint = withRid(client.baseUrl, "/api/sdk/v1/registration/email_verification/verify", options?.rid);
  const response = await client.post<RegistrationFlowResponse>(endpoint, payload);

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as "registration_not_found" | "registration_expired" | "invalid_code" | "code_expired",
        error_response,
      ];
    }

    return [null, RegistrationFlowResponseSchema.parse(response.data)];
  });
}

/**
 * Send a resume link to the user's email to continue registration.
 * Note: This endpoint doesn't require rid since it looks up by email.
 */
export async function sendResumeLink(
  client: ApiClientInterface,
  payload: SendResumeLinkPayload,
  handleResponse: HandleResponseFn,
): Promise<SendResumeLinkResult> {
  const response = await client.post<{ success: boolean }>("/api/sdk/v1/registration/resume", payload);

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "email_required" | "registration_flow_not_found", error_response];
    }

    return [null, null];
  });
}
