import { type ApiClientInterface, BaseService, type CommonErrors, type ServiceDependencies, type Payload } from "../../api";
import {
  CreateSignInResponseSchema,
  ErrorSchema,
  PasskeyOptionsResponseSchema,
  RequiredFieldsResponseSchema,
  SendMagicCodeErrorSchema,
  SendMagicCodeResponseSchema,
  TokenResponseSchema,
  type CreateSignInResponse,
  type ErrorResponse,
  type InvalidPasswordResponse,
  type PasskeyCredential,
  type PasskeyOptionsResponse,
  type RequiredFieldsResponse,
  type SendMagicCodeError,
  type SendMagicCodeResponse,
  type TokenResponse,
} from "./schemas";

// Re-export types for external use
export type {
  ErrorResponse,
  CreateSignInResponse,
  TokenResponse,
  SendMagicCodeResponse,
  RequiredFieldsResponse,
  SendMagicCodeError,
  InvalidPasswordResponse,
  PasskeyOptionsResponse,
  PasskeyCredential,
} from "./schemas";

export type { LoginOptions } from "./schemas";

// Argument types for unified interface
export type CreateSignInArgs = Payload<{ email: string; password?: string; sendMagicCode?: boolean }>;
export type SendMagicCodeArgs = { signInId: string };
export type AuthenticateWithPasswordArgs = { signInId: string } & Payload<{ password: string }>;
export type AuthenticateWithMagicCodeArgs = { signInId: string } & Payload<{ code: string }>;
// biome-ignore lint/suspicious/noExplicitAny: user fields are dynamic
export type UpdateMissingFieldsArgs = { signInId: string } & Payload<{ user: Record<string, any> }>;
export type RefreshTokenArgs = { signInId: string };
export type SendResetPasswordEmailArgs = { signInId: string } & Payload<{ returnTo: string }>;
export type ResetPasswordArgs = { signInId: string; token: string } & Payload<{ password: string; passwordConfirmation: string }>;
export type ValidateResetPasswordTokenArgs = { signInId: string; token: string };
export type SignOutArgs = { signInId: string };
export type GetPasskeyOptionsArgs = { signInId?: string };
export type AuthenticateWithPasskeyArgs = Payload<{ credential: PasskeyCredential }>;

// Result types
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

export type GetPasskeyOptionsResult = CommonErrors | ["bad_request", ErrorResponse] | [null, PasskeyOptionsResponse];

export type AuthenticateWithPasskeyResult =
  | CommonErrors
  | ["invalid_passkey", ErrorResponse]
  | ["verification_failed", ErrorResponse]
  | ["authentication_failed", ErrorResponse]
  | ["bad_request", ErrorResponse]
  | [null, TokenResponse];

export class AuthService extends BaseService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "AuthService", deps);
  }

  async createSignIn(args: CreateSignInArgs): Promise<CreateSignInResult> {
    const { email, password, sendMagicCode } = args.payload;
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

  async sendMagicCode(args: SendMagicCodeArgs): Promise<SendMagicCodeResult> {
    const { signInId } = args;
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

  async authenticateWithPassword(args: AuthenticateWithPasswordArgs): Promise<AuthenticateWithPasswordResult> {
    const { signInId, payload } = args;
    const response = await this.client.post<{ password: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
      password: payload.password,
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

  async updateMissingFields(args: UpdateMissingFieldsArgs): Promise<AuthenticateResultShared> {
    const { signInId, payload } = args;
    const response = await this.client.patch<unknown>(`/api/sdk/v1/sign_ins/${signInId}/update_required_fields`, {
      user: payload.user,
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

  async authenticateWithMagicCode(args: AuthenticateWithMagicCodeArgs): Promise<AuthenticateWithMagicCodeResult> {
    const { signInId, payload } = args;
    const response = await this.client.post<{ code: string }>(`/api/sdk/v1/sign_ins/${signInId}/authenticate`, {
      code: payload.code,
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

  async refreshToken(args: RefreshTokenArgs): Promise<RefreshTokenResult> {
    const { signInId } = args;
    const response = await this.client.post<Record<string, never>>(`/api/sdk/v1/sign_ins/${signInId}/refresh_token`, {});

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);

        return [error_response.error_identifier as "invalid_refresh_token" | "refresh_token_revoked" | "sign_in_not_found", error_response];
      }

      return [null, TokenResponseSchema.parse(response.data)];
    });
  }

  async sendResetPasswordEmail(args: SendResetPasswordEmailArgs): Promise<SendResetPasswordEmailResult> {
    const { signInId, payload } = args;
    const response = await this.client.post<null>(`/api/sdk/v1/sign_ins/${signInId}/password_reset/send`, {
      return_to: payload.returnTo,
    });

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

  async resetPassword(args: ResetPasswordArgs): Promise<ResetPasswordResult> {
    const { signInId, token, payload } = args;
    const response = await this.client.patch<null>(`/api/sdk/v1/sign_ins/${signInId}/password_reset`, {
      token,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
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

  async validateResetPasswordToken(args: ValidateResetPasswordTokenArgs): Promise<ValidateResetPasswordTokenResult> {
    const { signInId, token } = args;
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

  async signOut(args: SignOutArgs): Promise<SignOutResult> {
    const { signInId } = args;
    const response = await this.client.post<null>(`/api/sdk/v1/sign_ins/${signInId}/sign_out`, {});

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);

        return [error_response.error_identifier as "sign_in_not_found" | "missing_id_token" | "invalid_id_token", error_response];
      }

      return [null, null];
    });
  }

  async getPasskeyOptions(args?: GetPasskeyOptionsArgs): Promise<GetPasskeyOptionsResult> {
    const signInId = args?.signInId;
    const endpoint = signInId ? `/api/sdk/v1/passkeys/new?sid=${encodeURIComponent(signInId)}` : "/api/sdk/v1/passkeys/new";
    const response = await this.client.get<PasskeyOptionsResponse>(endpoint);

    return this.handleResponse(response, () => {
      if (!response.success) {
        const error_response = ErrorSchema.parse(response.data);
        return ["bad_request", error_response];
      }

      return [null, PasskeyOptionsResponseSchema.parse(response.data)];
    });
  }

  async authenticateWithPasskey(args: AuthenticateWithPasskeyArgs): Promise<AuthenticateWithPasskeyResult> {
    const { payload } = args;
    const response = await this.client.post<{ publicKeyCredential: PasskeyCredential }>("/api/sdk/v1/passkeys", {
      publicKeyCredential: payload.credential,
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
}
