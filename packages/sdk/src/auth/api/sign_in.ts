import type { ApiClientInterface, Payload } from "../../api/base-service";
import {
  type BrandConnectionRequiredResponse,
  BrandConnectionRequiredResponseSchema,
  type CreateSignInResponse,
  CreateSignInResponseSchema,
  type ErrorResponse,
  ErrorSchema,
  type InvalidPasswordResponse,
  InvalidPasswordResponseSchema,
  type PasskeyCredential,
  type PasskeyOptionsResponse,
  PasskeyOptionsResponseSchema,
  type RequiredFieldsResponse,
  RequiredFieldsResponseSchema,
  type SendMagicCodeError,
  SendMagicCodeErrorSchema,
  type SendMagicCodeResponse,
  SendMagicCodeResponseSchema,
  type TokenResponse,
  TokenResponseSchema,
} from "./schemas";
import { type CommonErrors, handleResponse } from "./shared";

// ============================================
// Argument types
// ============================================

export type CreateSignInArgs = Payload<{ email: string; password?: string; sendMagicCode?: boolean; originUrl?: string }>;
export type SendMagicCodeArgs = { signInId: string };
export type AuthenticateWithPasswordArgs = { signInId: string } & Payload<{ password: string }>;
export type AuthenticateWithMagicCodeArgs = { signInId: string } & Payload<{ code: string }>;
// biome-ignore lint/suspicious/noExplicitAny: user fields are dynamic
export type UpdateMissingFieldsArgs = { signInId: string } & Payload<{ user: Record<string, any> }>;
export type RefreshTokenArgs = { signInId: string; refreshToken: string };
export type SendResetPasswordEmailArgs = { signInId: string } & Payload<{ returnTo: string }>;
export type ResetPasswordArgs = { signInId: string; token: string } & Payload<{ password: string; passwordConfirmation: string }>;
export type ValidateResetPasswordTokenArgs = { signInId: string; token: string };
export type SignOutArgs = { signInId: string; globalLogout?: boolean };
export type GetPasskeyOptionsArgs = { signInId?: string };
export type AuthenticateWithPasskeyArgs = Payload<{ credential: PasskeyCredential }>;
export type ConnectBrandArgs = { signInId: string };

// ============================================
// Result types
// ============================================

export type CreateSignInResult =
  | CommonErrors
  | ["account_not_found", ErrorResponse]
  | [null, CreateSignInResponse]
  | AuthenticateWithPasswordResult
  | SendMagicCodeResult;

export type AuthenticateResultShared =
  | CommonErrors
  | ["sign_in_not_found", ErrorResponse]
  | ["sign_in_expired", ErrorResponse]
  | ["account_locked", ErrorResponse]
  | ["brand_connection_required", BrandConnectionRequiredResponse]
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

export type SendResetPasswordEmailResult =
  | CommonErrors
  | ["password_not_set", ErrorResponse]
  | ["reset_password_already_sent", ErrorResponse]
  | ["sign_in_not_found", ErrorResponse]
  | ["invalid_return_to", ErrorResponse]
  | ["return_to_required", ErrorResponse]
  | [null, null];

export type ResetPasswordResult =
  | CommonErrors
  | ["reset_token_missing", ErrorResponse]
  | ["invalid_reset_token", ErrorResponse]
  | ["reset_token_expired", ErrorResponse]
  | ["invalid_password", InvalidPasswordResponse]
  | [null, null];

export type ValidateResetPasswordTokenResult =
  | CommonErrors
  | ["reset_token_missing", ErrorResponse]
  | ["invalid_reset_token", ErrorResponse]
  | ["reset_token_expired", ErrorResponse]
  | [null, null];

export type SignOutResult =
  | CommonErrors
  | ["sign_in_not_found", ErrorResponse]
  | ["missing_id_token", ErrorResponse]
  | ["invalid_id_token", ErrorResponse]
  | [null, null];

export type SignedInResult = CommonErrors | ["not_found", ErrorResponse] | [null, TokenResponse];

export type GetPasskeyOptionsResult = CommonErrors | ["bad_request", ErrorResponse] | [null, PasskeyOptionsResponse];

export type AuthenticateWithPasskeyResult =
  | CommonErrors
  | ["invalid_passkey", ErrorResponse]
  | ["verification_failed", ErrorResponse]
  | ["authentication_failed", ErrorResponse]
  | ["bad_request", ErrorResponse]
  | [null, TokenResponse];

export type ConnectBrandResult =
  | CommonErrors
  | ["sign_in_not_found", ErrorResponse]
  | ["sign_in_not_authenticated", ErrorResponse]
  | ["missing_required_fields", RequiredFieldsResponse]
  | [null, TokenResponse];

// ============================================
// Helpers
// ============================================

/** Safely parse error response, returning a fallback if parsing fails */
function parseErrorResponse(data: unknown): ErrorResponse {
  const parsed = ErrorSchema.safeParse(data);
  return parsed.success ? parsed.data : { error_identifier: "unknown_error" };
}

// ============================================
// Sign-in API functions
// ============================================

export async function createSignIn(client: ApiClientInterface, args: CreateSignInArgs): Promise<CreateSignInResult> {
  const { email, password, sendMagicCode, originUrl = window.location.href } = args.payload;
  const response = await client.post<CreateSignInResponse>("/api/sdk/v1/sign_ins", { email, password, sendMagicCode, originUrl });

  return handleResponse(response, () => {
    if (!response.success) {
      const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);
      if (missing_fields_check.success) {
        return ["missing_required_fields", missing_fields_check.data];
      }
      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as
          | "account_not_found"
          | "sign_in_not_found"
          | "sign_in_expired"
          | "account_locked"
          | "invalid_password",
        error_response,
      ];
    }

    if (password) {
      return [null, TokenResponseSchema.parse(response.data)];
    }

    if (sendMagicCode) {
      return [null, SendMagicCodeResponseSchema.parse(response.data)];
    }

    return [null, CreateSignInResponseSchema.parse(response.data)];
  });
}

export async function sendMagicCode(client: ApiClientInterface, args: SendMagicCodeArgs): Promise<SendMagicCodeResult> {
  const { signInId } = args;
  const response = await client.post<SendMagicCodeResponse>(`/api/sdk/v1/sign_ins/${signInId}/send_magic_code`, {});

  return handleResponse(response, () => {
    if (!response.success) {
      const magicCodeError = SendMagicCodeErrorSchema.safeParse(response.data);
      if (magicCodeError.success) {
        return ["magic_code_recently_created", magicCodeError.data];
      }
      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "sign_in_not_found" | "sign_in_expired" | "account_locked", error_response];
    }

    return [null, SendMagicCodeResponseSchema.parse(response.data)];
  });
}

export async function authenticateWithPassword(
  client: ApiClientInterface,
  args: AuthenticateWithPasswordArgs,
): Promise<AuthenticateWithPasswordResult> {
  const { signInId, payload } = args;
  const response = await client.post<{ password: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
    password: payload.password,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const brand_connection_check = BrandConnectionRequiredResponseSchema.safeParse(response.data);
      if (brand_connection_check.success) {
        return ["brand_connection_required", brand_connection_check.data];
      }

      const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);
      if (missing_fields_check.success) {
        return ["missing_required_fields", missing_fields_check.data];
      }

      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as "sign_in_not_found" | "sign_in_expired" | "account_locked" | "invalid_password",
        error_response,
      ];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}

export async function authenticateWithMagicCode(
  client: ApiClientInterface,
  args: AuthenticateWithMagicCodeArgs,
): Promise<AuthenticateWithMagicCodeResult> {
  const { signInId, payload } = args;
  const response = await client.post<{ code: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
    code: payload.code,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const brand_connection_check = BrandConnectionRequiredResponseSchema.safeParse(response.data);
      if (brand_connection_check.success) {
        return ["brand_connection_required", brand_connection_check.data];
      }

      const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);
      if (missing_fields_check.success) {
        return ["missing_required_fields", missing_fields_check.data];
      }

      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as "sign_in_not_found" | "sign_in_expired" | "account_locked" | "not_valid" | "used" | "expired",
        error_response,
      ];
    }
    return [null, TokenResponseSchema.parse(response.data)];
  });
}

export async function updateMissingFields(
  client: ApiClientInterface,
  args: UpdateMissingFieldsArgs,
): Promise<AuthenticateResultShared> {
  const { signInId, payload } = args;
  const response = await client.patch<unknown>(`/api/sdk/v1/sign_ins/${signInId}/update_required_fields`, {
    user: payload.user,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);
      if (missing_fields_check.success) {
        return ["missing_required_fields", missing_fields_check.data];
      }

      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "sign_in_not_found" | "sign_in_expired" | "account_locked", error_response];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}

export async function refreshToken(client: ApiClientInterface, args: RefreshTokenArgs): Promise<RefreshTokenResult> {
  const { signInId, refreshToken } = args;
  const response = await client.post<Record<string, never>>(`/api/sdk/v1/sign_ins/${signInId}/refresh_token`, {
    refresh_token: refreshToken,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "invalid_refresh_token" | "refresh_token_revoked" | "sign_in_not_found", error_response];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}

export async function sendResetPasswordEmail(
  client: ApiClientInterface,
  args: SendResetPasswordEmailArgs,
): Promise<SendResetPasswordEmailResult> {
  const { signInId, payload } = args;
  const response = await client.post<null>(`/api/sdk/v1/sign_ins/${signInId}/password_reset/send`, {
    return_to: payload.returnTo,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as
          | "password_not_set"
          | "reset_password_already_sent"
          | "sign_in_not_found"
          | "invalid_return_to"
          | "return_to_required",
        error_response,
      ];
    }

    return [null, null];
  });
}

export async function resetPassword(client: ApiClientInterface, args: ResetPasswordArgs): Promise<ResetPasswordResult> {
  const { signInId, token, payload } = args;
  const response = await client.patch<null>(`/api/sdk/v1/sign_ins/${signInId}/password_reset`, {
    token,
    password: payload.password,
    password_confirmation: payload.passwordConfirmation,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const invalidPasswordParsed = InvalidPasswordResponseSchema.safeParse(response.data);
      if (invalidPasswordParsed.success) {
        return ["invalid_password", invalidPasswordParsed.data];
      }

      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "reset_token_missing" | "invalid_reset_token" | "reset_token_expired", error_response];
    }

    return [null, null];
  });
}

export async function validateResetPasswordToken(
  client: ApiClientInterface,
  args: ValidateResetPasswordTokenArgs,
): Promise<ValidateResetPasswordTokenResult> {
  const { signInId, token } = args;
  const response = await client.get<{ valid: boolean }>(
    `/api/sdk/v1/sign_ins/${signInId}/password_reset?token=${encodeURIComponent(token)}`,
  );

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "reset_token_missing" | "invalid_reset_token" | "reset_token_expired", error_response];
    }

    return [null, null];
  });
}

export async function signOut(
  client: ApiClientInterface,
  args: SignOutArgs,
  headers?: HeadersInit,
): Promise<SignOutResult> {
  const { signInId, globalLogout = false } = args;
  const response = await client.post<null>(`/api/sdk/v1/sign_ins/${signInId}/sign_out`, { globalLogout }, headers);

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "sign_in_not_found" | "missing_id_token" | "invalid_id_token", error_response];
    }

    return [null, null];
  });
}

export async function signedIn(client: ApiClientInterface): Promise<SignedInResult> {
  const response = await client.get<TokenResponse>("/api/sdk/v1/sign_ins/signed_in");

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return ["not_found", error_response];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}

// ============================================
// Passkey API functions
// ============================================

export async function getPasskeyOptions(
  client: ApiClientInterface,
  args?: GetPasskeyOptionsArgs,
): Promise<GetPasskeyOptionsResult> {
  const signInId = args?.signInId;
  const endpoint = signInId ? `/api/sdk/v1/passkeys/new?sid=${encodeURIComponent(signInId)}` : "/api/sdk/v1/passkeys/new";
  const response = await client.get<PasskeyOptionsResponse>(endpoint);

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return ["bad_request", error_response];
    }

    return [null, PasskeyOptionsResponseSchema.parse(response.data)];
  });
}

export async function authenticateWithPasskey(
  client: ApiClientInterface,
  args: AuthenticateWithPasskeyArgs,
): Promise<AuthenticateWithPasskeyResult> {
  const { payload } = args;
  const response = await client.post<{ publicKeyCredential: PasskeyCredential }>("/api/sdk/v1/passkeys", {
    publicKeyCredential: payload.credential,
  });

  return handleResponse(response, () => {
    if (!response.success) {
      const error_response = parseErrorResponse(response.data);
      return [
        error_response.error_identifier as "invalid_passkey" | "verification_failed" | "authentication_failed" | "bad_request",
        error_response,
      ];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}

// ============================================
// Brand connect API functions
// ============================================

export async function connectBrand(client: ApiClientInterface, args: ConnectBrandArgs): Promise<ConnectBrandResult> {
  const { signInId } = args;
  const response = await client.post<TokenResponse>(`/api/sdk/v1/sign_ins/${signInId}/brand_connect`, {});

  return handleResponse(response, () => {
    if (!response.success) {
      const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);
      if (missing_fields_check.success) {
        return ["missing_required_fields", missing_fields_check.data];
      }

      const error_response = parseErrorResponse(response.data);
      return [error_response.error_identifier as "sign_in_not_found" | "sign_in_not_authenticated", error_response];
    }

    return [null, TokenResponseSchema.parse(response.data)];
  });
}