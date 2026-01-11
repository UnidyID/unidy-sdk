import * as Sentry from "@sentry/browser";
import { jwtDecode } from "jwt-decode";
import type { UnidyClient } from "../api";
import { getUnidyClient } from "../api";
import { t } from "../i18n";
import { waitForConfig } from "../shared/store/unidy-store";
import { AuthHelpers } from "./auth-helpers";
import { authState, authStore } from "./store/auth-store";

export interface TokenPayload {
  sub: string; // unidy id
  sid: string; // sign-in id
  exp: number;
  iat: number;
  iss: string;
  aud: string;
  nonce: string;
  auth_time: number;
  email: string;
  email_verified: boolean;
  [key: string]: unknown;
}

export type AuthError = Error & {
  code: "TOKEN_EXPIRED" | "REFRESH_FAILED" | "NO_TOKEN" | "INVALID_TOKEN" | "SIGN_IN_NOT_FOUND" | "SIGN_OUT_FAILED";
  requiresReauth: boolean;
};

export class Auth {
  private static instance: Auth;

  readonly helpers: AuthHelpers;

  private constructor(client: UnidyClient) {
    this.helpers = new AuthHelpers(client);
  }

  static Errors = {
    email: {
      NOT_FOUND: "account_not_found",
    },
    magicCode: {
      RECENTLY_CREATED: "magic_code_recently_created",
      NOT_VALID: "magic_code_not_valid",
      EXPIRED: "magic_code_expired",
      USED: "magic_code_used",
    },
    password: {
      INVALID: "invalid_password",
      NOT_SET: "password_not_set",
      RESET_PASSWORD_ALREADY_SENT: "reset_password_already_sent",
    },
    general: {
      ACCOUNT_LOCKED: "account_locked",
      SIGN_IN_EXPIRED: "sign_in_expired",
    },
  } as const;

  static async getInstance(): Promise<Auth> {
    if (!Auth.isInitialized()) {
      await waitForConfig();

      return Auth.initialize(getUnidyClient());
    }

    return Auth.instance;
  }

  static async initialize(client: UnidyClient): Promise<Auth> {
    if (Auth.instance) {
      return Auth.instance;
    }

    Auth.instance = new Auth(client);

    Auth.instance.helpers.handleSocialAuthRedirect();
    await Auth.instance.helpers.handleResetPasswordRedirect();

    if (Auth.instance.isTokenValid(authState.token)) {
      authStore.setAuthenticated(true);
    }

    return Auth.instance;
  }

  static isInitialized(): boolean {
    return !!Auth.instance;
  }

  isTokenValid(token: string | TokenPayload | null, expirationBuffer = 5): boolean {
    try {
      let decoded: TokenPayload | null;

      if (typeof token === "string") {
        decoded = jwtDecode<TokenPayload>(token);
      } else {
        decoded = token;
      }

      if (!decoded) return false;

      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime + expirationBuffer;
    } catch (error) {
      Sentry.captureException(error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return typeof token === "string";
  }

  async getToken(): Promise<string | AuthError> {
    const currentToken = authState.token;

    if (currentToken && this.isTokenValid(currentToken)) {
      return currentToken;
    }

    await this.helpers.refreshToken();

    if (authState.globalErrors.auth || !authState.token) {
      return this.createAuthError(t("errors.refresh_failed"), "REFRESH_FAILED", true);
    }

    return authState.token as string;
  }

  async userData(): Promise<TokenPayload | null> {
    const token = await this.getToken();

    if (typeof token !== "string") {
      return null;
    }

    if (!token) {
      return null;
    }

    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async logout(): Promise<boolean | AuthError> {
    const [error, _] = await this.helpers.logout();

    if (error) {
      return this.createAuthError(t("errors.sign_out_failed", { reason: error }), "SIGN_OUT_FAILED", false);
    }

    authStore.reset();

    return true;
  }

  getEmail(): string | null {
    return authState.email;
  }

  private createAuthError(message: string, code: AuthError["code"], requiresReauth = false): AuthError {
    const error = new Error(message) as AuthError;
    error.code = code;
    error.requiresReauth = requiresReauth;

    return error;
  }
}
