import * as Sentry from "@sentry/browser";
import * as z from "zod";

import { type ApiClient, type SchemaValidationError, SchemaValidationErrorSchema } from "../../api";
import { UserProfileSchema } from "../../profile";
import { unidyState } from "../../shared/store/unidy-store";

const LoginOptionsSchema = z.object({
  magic_link: z.boolean(),
  password: z.boolean(),
  social_logins: z.array(z.string()),
  passkey: z.boolean(),
});

const CreateSignInResponseSchema = z.object({
  sid: z.string(),
  status: z.enum(["pending_verification", "authenticated", "completed"]),
  email: z.string(),
  expired: z.boolean(),
  login_options: LoginOptionsSchema,
});

const ErrorSchema = z.object({
  error_identifier: z.string(),
});

const SendMagicCodeResponseSchema = z.object({
  enable_resend_after: z.number(),
  sid: z.string().optional(),
});

const SendMagicCodeErrorSchema = z.object({
  error_identifier: z.string(),
  enable_resend_after: z.number(),
});

const TokenResponseSchema = z.object({
  jwt: z.string(),
  sid: z.string().optional(),
});

const RequiredFieldsResponseSchema = z.object({
  error_identifier: z.literal("missing_required_fields"),
  fields: UserProfileSchema.omit({ custom_attributes: true }).partial().extend({
    custom_attributes: UserProfileSchema.shape.custom_attributes?.optional(),
  }),
  sid: z.string().optional(),
});

const InvalidPasswordResponseSchema = z.object({
  error_details: z.object({
    password: z.array(z.string()),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorSchema>;
export type LoginOptions = z.infer<typeof LoginOptionsSchema>;
export type CreateSignInResponse = z.infer<typeof CreateSignInResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type SendMagicCodeResponse = z.infer<typeof SendMagicCodeResponseSchema>;
export type RequiredFieldsResponse = z.infer<typeof RequiredFieldsResponseSchema>;
export type SendMagicCodeError = z.infer<typeof SendMagicCodeErrorSchema>;

type CommonErrors = ["connection_failed", null] | ["schema_validation_error", SchemaValidationError];

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

export type InvalidPasswordResponse = z.infer<typeof InvalidPasswordResponseSchema>;

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

export type SingleSignOnResult = CommonErrors | ["not_found", ErrorResponse] | [null, TokenResponse];

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

export type PasskeyOptionsResponse = z.infer<typeof PasskeyOptionsResponseSchema>;
export type PasskeyCredential = z.infer<typeof PasskeyCredentialSchema>;

export type GetPasskeyOptionsResult = CommonErrors | ["bad_request", ErrorResponse] | [null, PasskeyOptionsResponse];

export type AuthenticateWithPasskeyResult =
  | CommonErrors
  | ["invalid_passkey", ErrorResponse]
  | ["verification_failed", ErrorResponse]
  | ["authentication_failed", ErrorResponse]
  | ["bad_request", ErrorResponse]
  | [null, TokenResponse];

export class AuthService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async createSignIn(email: string, password?: string, sendMagicCode?: boolean): Promise<CreateSignInResult> {
    const response = await this.client.post<CreateSignInResponse>("/api/sdk/v1/sign_ins", { email, password, sendMagicCode });

    return this.handleResponse(response, () => {
      if (!response.success) {
        const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);

        if (missing_fields_check.success) {
          return ["missing_required_fields", missing_fields_check.data];
        }
        const error_response = ErrorSchema.parse(response.data);
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

  async sendMagicCode(signInId: string): Promise<SendMagicCodeResult> {
    const response = await this.client.post<SendMagicCodeResponse>(`/api/sdk/v1/sign_ins/${signInId}/send_magic_code`, {});

    return this.handleResponse(response, () => {
      if (!response.success) {
        try {
          const error_response = SendMagicCodeErrorSchema.parse(response.data);
          return ["magic_code_recently_created", error_response];
        } catch {
          const error_response = ErrorSchema.parse(response.data);
          return [error_response.error_identifier as "sign_in_not_found" | "sign_in_expired" | "account_locked", error_response];
        }
      }

      return [null, SendMagicCodeResponseSchema.parse(response.data)];
    });
  }

  async authenticateWithPassword(signInId: string, password: string): Promise<AuthenticateWithPasswordResult> {
    const response = await this.client.post<{ password: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
      password,
    });

    return this.handleResponse(response, () => {
      if (!response.success) {
        const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);

        if (missing_fields_check.success) {
          return ["missing_required_fields", missing_fields_check.data];
        }
        const error_response = ErrorSchema.parse(response.data);

        return [
          error_response.error_identifier as "sign_in_not_found" | "sign_in_expired" | "account_locked" | "invalid_password",
          error_response,
        ];
      }

      return [null, TokenResponseSchema.parse(response.data)];
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: user fields are dynamic
  async updateMissingFields(signInId: string, user: Record<string, any>): Promise<AuthenticateResultShared> {
    const response = await this.client.patch<unknown>(`/api/sdk/v1/sign_ins/${signInId}/update_required_fields`, {
      user,
    });

    return this.handleResponse(response, () => {
      if (!response.success) {
        const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);
        if (missing_fields_check.success) {
          return ["missing_required_fields", missing_fields_check.data];
        }

        const error_response = ErrorSchema.parse(response.data);

        return [error_response.error_identifier as "sign_in_not_found" | "sign_in_expired" | "account_locked", error_response];
      }

      return [null, TokenResponseSchema.parse(response.data)];
    });
  }

  async authenticateWithMagicCode(signInId: string, code: string): Promise<AuthenticateWithMagicCodeResult> {
    const response = await this.client.post<{ code: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
      code,
    });

    return this.handleResponse(response, () => {
      if (!response.success) {
        const missing_fields_check = RequiredFieldsResponseSchema.safeParse(response.data);

        if (missing_fields_check.success) {
          return ["missing_required_fields", missing_fields_check.data];
        }

        const error_response = ErrorSchema.parse(response.data);

        return [
          error_response.error_identifier as "sign_in_not_found" | "sign_in_expired" | "account_locked" | "not_valid" | "used" | "expired",
          error_response,
        ];
      }
      return [null, TokenResponseSchema.parse(response.data)];
    });
  }

  async refreshToken(signInId: string): Promise<RefreshTokenResult> {
    const response = await this.client.post<Record<string, never>>(`/api/sdk/v1/sign_ins/${signInId}/refresh_token`, {});

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);

        return [error_response.error_identifier as "invalid_refresh_token" | "refresh_token_revoked" | "sign_in_not_found", error_response];
      }

      return [null, TokenResponseSchema.parse(response.data)];
    });
  }

  async sendResetPasswordEmail(signInId: string, returnTo: string): Promise<SendResetPasswordEmailResult> {
    const response = await this.client.post<null>(`/api/sdk/v1/sign_ins/${signInId}/password_reset/send`, { return_to: returnTo });

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);

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

  async resetPassword(signInId: string, token: string, password: string, passwordConfirmation: string): Promise<ResetPasswordResult> {
    const response = await this.client.patch<null>(`/api/sdk/v1/sign_ins/${signInId}/password_reset`, {
      token,
      password,
      password_confirmation: passwordConfirmation,
    });

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);

        return [
          error_response.error_identifier as "reset_token_missing" | "invalid_reset_token" | "reset_token_expired" | "invalid_password",
          response.data,
        ];
      }

      return [null, null];
    });
  }

  async validateResetPasswordToken(signInId: string, token: string): Promise<ValidateResetPasswordTokenResult> {
    const response = await this.client.get<{ valid: boolean }>(
      `/api/sdk/v1/sign_ins/${signInId}/password_reset?token=${encodeURIComponent(token)}`,
    );

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);
        return [error_response.error_identifier as "reset_token_missing" | "invalid_reset_token" | "reset_token_expired", error_response];
      }

      return [null, null];
    });
  }

  async signOut(signInId: string, useSso = false): Promise<SignOutResult> {
    const response = await this.client.post<null>(`/api/sdk/v1/sign_ins/${signInId}/sign_out`, { useSso });

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);

        return [error_response.error_identifier as "sign_in_not_found" | "missing_id_token" | "invalid_id_token", error_response];
      }

      return [null, null];
    });
  }

  async singleSignOn(): Promise<SingleSignOnResult> {
    const response = await this.client.get<TokenResponse>("/api/sdk/v1/sign_ins/single_sign_on");

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);
        return ["not_found", error_response];
      }

      return [null, TokenResponseSchema.parse(response.data)];
    });
  }

  async getPasskeyOptions(sid?: string): Promise<GetPasskeyOptionsResult> {
    const endpoint = sid ? `/api/sdk/v1/passkeys/new?sid=${encodeURIComponent(sid)}` : "/api/sdk/v1/passkeys/new";
    const response = await this.client.get<PasskeyOptionsResponse>(endpoint);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);
        return ["bad_request", error_response];
      }

      return [null, PasskeyOptionsResponseSchema.parse(response.data)];
    });
  }

  async authenticateWithPasskey(credential: PasskeyCredential): Promise<AuthenticateWithPasskeyResult> {
    const response = await this.client.post<{ publicKeyCredential: PasskeyCredential }>("/api/sdk/v1/passkeys", {
      publicKeyCredential: credential,
    });

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);
        return [
          error_response.error_identifier as "invalid_passkey" | "verification_failed" | "authentication_failed" | "bad_request",
          error_response,
        ];
      }

      return [null, TokenResponseSchema.parse(response.data)];
    });
  }

  private handleResponse<T>(
    // biome-ignore lint/suspicious/noExplicitAny: generic handler for all responses
    response: any,
    handler: () => T,
  ): T | ["connection_failed", null] | ["schema_validation_error", SchemaValidationError] {
    if (response.connectionError) {
      unidyState.backendConnected = false;

      return ["connection_failed", null];
    }

    try {
      return handler();
    } catch (error) {
      Sentry.captureException(error);
      return ["schema_validation_error", SchemaValidationErrorSchema.parse(response.data)];
    }
  }
}
