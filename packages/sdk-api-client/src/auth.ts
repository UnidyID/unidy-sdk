import type { ApiClient } from "./api_client";
import type { SchemaValidationError } from "./shared";
import { SchemaValidationErrorSchema } from "./shared";

import * as z from "zod";

const CreateSignInResponseSchema = z.object({
  sid: z.string(),
  status: z.enum(["pending_verification", "authenticated"]),
  email: z.string(),
  expired: z.boolean(),
});

const ErrorSchema = z.object({
  error: z.string(),
});

const SendMagicCodeSuccessSchema = z.object({
  enable_resend_after: z.number(),
});

const SendMagicCodeErrorSchema = z.object({
  error: z.string(),
  enable_resend_after: z.number(),
});

const TokenResponseSchema = z.object({
  jwt: z.string(),
  refresh_token: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorSchema>;
export type CreateSignInResponse = z.infer<typeof CreateSignInResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type SendMagicCodeSuccess = z.infer<typeof SendMagicCodeSuccessSchema>;
export type SendMagicCodeError = z.infer<typeof SendMagicCodeErrorSchema>;

export type CreateSignInResult =
  | ["account_not_found", ErrorResponse]
  | ["schema_validation_error", SchemaValidationError]
  | [null, CreateSignInResponse];

export type AuthenticateResultShared =
  | ["sign_in_not_found", ErrorResponse]
  | ["sign_in_expired", ErrorResponse]
  | ["account_locked", ErrorResponse]
  | ["schema_validation_error", SchemaValidationError]
  | [null, TokenResponse];

export type SendMagicCodeResult =
  | ["magic_code_recently_created", SendMagicCodeError]
  | ["sign_in_not_found", ErrorResponse]
  | ["sign_in_expired", ErrorResponse]
  | ["account_locked", ErrorResponse]
  | ["schema_validation_error", SchemaValidationError]
  | [null, SendMagicCodeSuccess];

export type AuthenticateWithPasswordResult = ["invalid_password", ErrorResponse] | AuthenticateResultShared;

export type AuthenticateWithMagicCodeResult =
  | ["not_valid", ErrorResponse]
  | ["used", ErrorResponse]
  | ["expired", ErrorResponse]
  | AuthenticateResultShared;

export type RefreshTokenResult =
  | ["invalid_refresh_token", ErrorResponse]
  | ["refresh_token_revoked", ErrorResponse]
  | ["sign_in_not_found", ErrorResponse]
  | ["schema_validation_error", SchemaValidationError]
  | [null, TokenResponse];

export class AuthService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async createSignIn(email: string): Promise<CreateSignInResult> {
    const response = await this.client.post<CreateSignInResponse>("/api/sdk/v1/sign_ins", { email });
    try {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);

        return ["account_not_found", error_response];
      }

      return [null, CreateSignInResponseSchema.parse(response.data)];
    } catch (error) {
      return ["schema_validation_error", SchemaValidationErrorSchema.parse(response.data)];
    }
  }

  async sendMagicCode(signInId: string): Promise<SendMagicCodeResult> {
    const response = await this.client.get<void>(`/api/sdk/v1/sign_ins/${signInId}/send_magic_code`);

    try {
      if (!response.success) {
        try {
          const error_response = SendMagicCodeErrorSchema.parse(response.data);
          return ["magic_code_recently_created", error_response];
        } catch {
          const error_response = ErrorSchema.parse(response.data);
          return [error_response.error as "sign_in_not_found" | "sign_in_expired" | "account_locked", error_response];
        }
      }

      return [null, SendMagicCodeSuccessSchema.parse(response.data)];
    } catch (error) {
      return ["schema_validation_error", SchemaValidationErrorSchema.parse(response.data)];
    }
  }

  async authenticateWithPassword(signInId: string, password: string): Promise<AuthenticateWithPasswordResult> {
    const response = await this.client.post<{ password: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
      password,
    });
    try {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);

        return [error_response.error as "sign_in_not_found" | "sign_in_expired" | "account_locked" | "invalid_password", error_response];
      }

      return [null, TokenResponseSchema.parse(response.data)];
    } catch (error) {
      return ["schema_validation_error", SchemaValidationErrorSchema.parse(response.data)];
    }
  }

  async authenticateWithMagicCode(signInId: string, code: string): Promise<AuthenticateWithMagicCodeResult> {
    const response = await this.client.post<{ code: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
      code,
    });

    try {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);
        return [
          error_response.error as "sign_in_not_found" | "sign_in_expired" | "account_locked" | "not_valid" | "used" | "expired",
          error_response,
        ];
      }
      return [null, TokenResponseSchema.parse(response.data)];
    } catch (error) {
      return ["schema_validation_error", SchemaValidationErrorSchema.parse(response.data)];
    }
  }

  async refreshToken(signInId: string, refreshToken: string): Promise<RefreshTokenResult> {
    const response = await this.client.post<{ refresh_token: string }>(`/api/sdk/v1/sign_ins/${signInId}/refresh_token`, {
      refresh_token: refreshToken,
    });

    try {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);

        return [error_response.error as "invalid_refresh_token" | "refresh_token_revoked" | "sign_in_not_found", error_response];
      }

      return [null, TokenResponseSchema.parse(response.data)];
    } catch (error) {
      return ["schema_validation_error", SchemaValidationErrorSchema.parse(response.data)];
    }
  }
}
