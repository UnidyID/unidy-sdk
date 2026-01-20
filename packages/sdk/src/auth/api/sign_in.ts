import * as z from "zod";

import type { ApiClient } from "../../api";
import {
  type CommonErrors,
  ErrorSchema,
  type ErrorResponse,
  handleResponse,
  RequiredFieldsResponseSchema,
  type RequiredFieldsResponse,
  TokenResponseSchema,
  type TokenResponse,
} from "./shared";

// Response schemas
const CreateSignInResponseSchema = z.object({
  sid: z.string(),
  status: z.enum(["pending_verification", "authenticated", "completed"]),
  email: z.string(),
  expired: z.boolean(),
});

const SendMagicCodeResponseSchema = z.object({
  enable_resend_after: z.number(),
});

const SendMagicCodeErrorSchema = z.object({
  error: z.string(),
  enable_resend_after: z.number(),
});

const PasskeyOptionsResponseSchema = z.object({
  challenge: z.string(),
  timeout: z.number(),
  rpId: z.string(),
  userVerification: z.string(),
  allowCredentials: z.array(z.any()),
});

const PasskeyCredentialSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
  }),
  type: z.string(),
});

// Exported types
export type CreateSignInPayload = { email: string };
export type CreateSignInResponse = z.infer<typeof CreateSignInResponseSchema>;
export type SendMagicCodeResponse = z.infer<typeof SendMagicCodeResponseSchema>;
export type SendMagicCodeError = z.infer<typeof SendMagicCodeErrorSchema>;
export type PasskeyOptionsResponse = z.infer<typeof PasskeyOptionsResponseSchema>;
export type PasskeyCredential = z.infer<typeof PasskeyCredentialSchema>;

// Result types
export type CreateSignInResult = CommonErrors | ["account_not_found", ErrorResponse] | [null, CreateSignInResponse];

export type AuthenticateResultShared =
  | CommonErrors
  | ["sign_in_not_found", ErrorResponse]
  | ["sign_in_expired", ErrorResponse]
  | ["account_locked", ErrorResponse]
  | ["missing_required_fields", RequiredFieldsResponse]
  | [null, TokenResponse];

export type SendMagicCodeResult =
  | CommonErrors
  | ["magic_code_recently_created", SendMagicCodeError]
  | ["sign_in_not_found", ErrorResponse]
  | ["sign_in_expired", ErrorResponse]
  | ["account_locked", ErrorResponse]
  | [null, SendMagicCodeResponse];

export type AuthenticateWithPasswordResult = ["invalid_password", ErrorResponse] | AuthenticateResultShared;

export type AuthenticateWithMagicCodeResult =
  | ["not_valid", ErrorResponse]
  | ["used", ErrorResponse]
  | ["expired", ErrorResponse]
  | AuthenticateResultShared;

export type RefreshTokenResult =
  | CommonErrors
  | ["invalid_refresh_token", ErrorResponse]
  | ["refresh_token_revoked", ErrorResponse]
  | ["sign_in_not_found", ErrorResponse]
  | [null, TokenResponse];

export type ResetPasswordResult =
  | CommonErrors
  | ["password_not_set", ErrorResponse]
  | ["reset_password_already_sent", ErrorResponse]
  | ["sign_in_not_found", ErrorResponse]
  | [null, null];

export type SignOutResult =
  | CommonErrors
  | ["sign_in_not_found", ErrorResponse]
  | ["missing_id_token", ErrorResponse]
  | ["invalid_id_token", ErrorResponse]
  | [null, null];

export type GetPasskeyOptionsResult = CommonErrors | ["bad_request", ErrorResponse] | [null, PasskeyOptionsResponse];

export type AuthenticateWithPasskeyResult =
  | CommonErrors
  | ["invalid_passkey", ErrorResponse]
  | ["verification_failed", ErrorResponse]
  | ["authentication_failed", ErrorResponse]
  | ["bad_request", ErrorResponse]
  | [null, TokenResponse];

// Sign-in API functions
export async function createSignIn(client: ApiClient, email: string): Promise<CreateSignInResult> {
  const response = await client.post<CreateSignInResponse>("/api/sdk/v1/sign_ins", { email });

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = ErrorSchema.parse(response.data);
      return ["account_not_found", error_response];
    }

    return [null, CreateSignInResponseSchema.parse(response.data)];
  });
}

export async function sendMagicCode(client: ApiClient, signInId: string): Promise<SendMagicCodeResult> {
  const response = await client.post<SendMagicCodeResponse>(`/api/sdk/v1/sign_ins/${signInId}/send_magic_code`, {});

  return handleResponse(response, () => {
    if (!response.success) {
      try {
        const error_response = SendMagicCodeErrorSchema.parse(response.data);
        return ["magic_code_recently_created", error_response];
      } catch {
        const error_response = ErrorSchema.parse(response.data);
        return [error_response.error as "sign_in_not_found" | "sign_in_expired" | "account_locked", error_response];
      }
    }

    return [null, SendMagicCodeResponseSchema.parse(response.data)];
  });
}

export async function authenticateWithPassword(
  client: ApiClient,
  signInId: string,
  password: string,
): Promise<AuthenticateWithPasswordResult> {
  const response = await client.post<{ password: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
    password,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);

      if (missing_fields_check.success) {
        return ["missing_required_fields", missing_fields_check.data];
      }
      const error_response = ErrorSchema.parse(response.data);

      return [
        error_response.error as "sign_in_not_found" | "sign_in_expired" | "account_locked" | "invalid_password",
        error_response,
      ];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}

export async function authenticateWithMagicCode(
  client: ApiClient,
  signInId: string,
  code: string,
): Promise<AuthenticateWithMagicCodeResult> {
  const response = await client.post<{ code: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
    code,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);

      if (missing_fields_check.success) {
        return ["missing_required_fields", missing_fields_check.data];
      }

      const error_response = ErrorSchema.parse(response.data);

      return [
        error_response.error as "sign_in_not_found" | "sign_in_expired" | "account_locked" | "not_valid" | "used" | "expired",
        error_response,
      ];
    }
    return [null, TokenResponseSchema.parse(response.data)];
  });
}

// biome-ignore lint/suspicious/noExplicitAny: dynamic user fields
export async function updateMissingFields(
  client: ApiClient,
  signInId: string,
  user: Record<string, any>,
): Promise<AuthenticateResultShared> {
  const response = await client.patch<unknown>(`/api/sdk/v1/sign_ins/${signInId}/update_required_fields`, {
    user,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);
      if (missing_fields_check.success) {
        return ["missing_required_fields", missing_fields_check.data];
      }

      const error_response = ErrorSchema.parse(response.data);

      return [error_response.error as "sign_in_not_found" | "sign_in_expired" | "account_locked", error_response];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}

export async function refreshToken(client: ApiClient, signInId: string): Promise<RefreshTokenResult> {
  const response = await client.post<Record<string, never>>(`/api/sdk/v1/sign_ins/${signInId}/refresh_token`, {});

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = ErrorSchema.parse(response.data);

      return [error_response.error as "invalid_refresh_token" | "refresh_token_revoked" | "sign_in_not_found", error_response];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}

export async function sendResetPasswordEmail(client: ApiClient, signInId: string): Promise<ResetPasswordResult> {
  const response = await client.post<null>(`/api/sdk/v1/sign_ins/${signInId}/send_reset_password`, {});

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = ErrorSchema.parse(response.data);

      return [error_response.error as "password_not_set" | "reset_password_already_sent" | "sign_in_not_found", error_response];
    }

    return [null, null];
  });
}

export async function signOut(client: ApiClient, signInId: string): Promise<SignOutResult> {
  const response = await client.post<null>(`/api/sdk/v1/sign_ins/${signInId}/sign_out`, {});

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = ErrorSchema.parse(response.data);

      return [error_response.error as "sign_in_not_found" | "missing_id_token" | "invalid_id_token", error_response];
    }

    return [null, null];
  });
}

export async function getPasskeyOptions(client: ApiClient, sid?: string): Promise<GetPasskeyOptionsResult> {
  const endpoint = sid ? `/api/sdk/v1/passkeys/new?sid=${encodeURIComponent(sid)}` : "/api/sdk/v1/passkeys/new";
  const response = await client.get<PasskeyOptionsResponse>(endpoint);

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = ErrorSchema.parse(response.data);
      return ["bad_request", error_response];
    }

    return [null, PasskeyOptionsResponseSchema.parse(response.data)];
  });
}

export async function authenticateWithPasskey(
  client: ApiClient,
  credential: PasskeyCredential,
): Promise<AuthenticateWithPasskeyResult> {
  const response = await client.post<{ publicKeyCredential: PasskeyCredential }>("/api/sdk/v1/passkeys", {
    publicKeyCredential: credential,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = ErrorSchema.parse(response.data);
      return [
        error_response.error as "invalid_passkey" | "verification_failed" | "authentication_failed" | "bad_request",
        error_response,
      ];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}
