import * as Sentry from "@sentry/browser";
import { jwtDecode } from "jwt-decode";
import type { UnidyClient } from "../api";
import { getUnidyClient } from "../api";
import { t } from "../i18n";
import { waitForConfig } from "../shared/store/unidy-store";
import { AuthHelpers } from "./auth-helpers";
import { authState, authStore } from "./store/auth-store";

const DEFAULT_TOKEN_EXPIRATION_BUFFER_SECONDS = 10;

/**
 * Decoded JWT payload for Unidy auth tokens.
 */
export interface TokenPayload {
  /** Unidy user id (subject). */
  sub: string;
  /** Sign-in session id. */
  sid: string;
  /** Expiration time (Unix seconds). */
  exp: number;
  /** Issued-at time (Unix seconds). */
  iat: number;
  /** Issuer. */
  iss: string;
  /** Audience. */
  aud: string;
  /** Nonce. */
  nonce: string;
  /** Time of authentication (Unix seconds). */
  auth_time: number;
  /** User email. */
  email: string;
  /** Whether the email has been verified. */
  email_verified: boolean;
  [key: string]: unknown;
}

/**
 * Auth-specific error with a machine-readable code and whether re-authentication is required.
 */
export type AuthError = Error & {
  code: "TOKEN_EXPIRED" | "REFRESH_FAILED" | "NO_TOKEN" | "INVALID_TOKEN" | "SIGN_IN_NOT_FOUND" | "SIGN_OUT_FAILED";
  requiresReauth: boolean;
};

/**
 * Singleton auth service: token validation, refresh, logout, and auth flow state (step, email, navigation).
 */
export class Auth {
  private static instance: Auth;

  /** Helper methods for redirects, token refresh, and sign-in step recovery. */
  readonly helpers: AuthHelpers;

  private constructor(client: UnidyClient) {
    this.helpers = new AuthHelpers(client);
  }

  /** Known error codes for email, magic code, password, and general auth flows. */
  static Errors = {
    email: {
      NOT_FOUND: "account_not_found",
    },
    general: {
      ACCOUNT_LOCKED: "account_locked",
      SIGN_IN_ALREADY_PROCESSED: "sign_in_already_processed",
      SIGN_IN_EXPIRED: "sign_in_expired",
      SIGN_IN_NOT_FOUND: "sign_in_not_found",
    },
    magicCode: {
      EXPIRED: "magic_code_expired",
      NOT_VALID: "magic_code_not_valid",
      RECENTLY_CREATED: "magic_code_recently_created",
      USED: "magic_code_used",
    },
    password: {
      INVALID: "invalid_password",
      NOT_SET: "password_not_set",
      RESET_PASSWORD_ALREADY_SENT: "reset_password_already_sent",
    },
    passwordReset: {
      PASSWORD_TOO_WEAK: "password_too_weak",
    },
  } as const;

  /**
   * Returns the singleton Auth instance, initializing it (and waiting for config) if needed.
   */
  static async getInstance(): Promise<Auth> {
    if (!Auth.isInitialized()) {
      await waitForConfig();

      return Auth.initialize(getUnidyClient());
    }

    return Auth.instance;
  }

  /**
   * Creates and configures the singleton Auth instance (redirect handling, reset-password, token check, step recovery).
   * Idempotent: returns existing instance if already initialized.
   *
   * @param client - Unidy API client used for auth requests.
   */
  static async initialize(client: UnidyClient): Promise<Auth> {
    if (Auth.instance) {
      return Auth.instance;
    }

    Auth.instance = new Auth(client);

    Auth.instance.helpers.handleSocialAuthRedirect();
    Auth.instance.helpers.extractSidFromUrl();
    await Auth.instance.helpers.handleResetPasswordRedirect();

    if (Auth.instance.isTokenValid(authState.token)) {
      authStore.setAuthenticated(true);
    }

    // Resume auth flow after page reload or new tab by recovering the sign-in step
    Auth.instance.helpers.recoverSignInStep();

    return Auth.instance;
  }

  /** Whether the Auth singleton has been initialized. */
  static isInitialized(): boolean {
    return !!Auth.instance;
  }

  /**
   * Checks whether a JWT token is valid and not expired.
   *
   * @param token - The JWT token to validate. Can be a raw JWT string, a decoded TokenPayload, or null.
   * @param expirationBuffer - Number of seconds before actual expiration to consider the token invalid, used to prevent race conditions with preemptive token refresh. Defaults to 10 seconds.
   * @returns `true` if the token is valid and won't expire within the buffer period, `false` otherwise.
   * @throws Error if expirationBuffer is not positive number
   */
  isTokenValid(token: string | TokenPayload | null, expirationBuffer = DEFAULT_TOKEN_EXPIRATION_BUFFER_SECONDS): boolean {
    if (!Number.isFinite(expirationBuffer) || expirationBuffer <= 0) {
      throw new Error("expirationBuffer must be a positive finite number");
    }

    try {
      let decoded: TokenPayload | null;

      if (typeof token === "string") {
        decoded = jwtDecode<TokenPayload>(token);
      } else {
        decoded = token;
      }

      if (!decoded) return false;

      if (typeof decoded.exp !== "number" || !Number.isFinite(decoded.exp)) {
        return false;
      }

      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime + expirationBuffer;
    } catch (error) {
      Sentry.captureException(error);
      return false;
    }
  }

  /** Returns whether the user has a valid token (after refresh if needed). */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return typeof token === "string";
  }

  /**
   * Returns a valid access token, refreshing it if expired. Use this for authenticated API calls.
   *
   * @returns The JWT string, or an AuthError if refresh fails or no token is available.
   */
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

  /**
   * Returns the decoded JWT payload for the current user, or null if not authenticated or decode fails.
   */
  async userTokenPayload(): Promise<TokenPayload | null> {
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

  /**
   * Logs the user out (backend call when possible) and clears local auth state. Local state is always cleared even if backend fails.
   *
   * @returns `true` on success, or an AuthError if backend logout failed.
   */
  async logout(): Promise<boolean | AuthError> {
    const [error, _] = await this.helpers.logout();

    // Always clear local tokens, even if backend logout fails
    authStore.reset();

    if (error) {
      return this.createAuthError(t("errors.sign_out_failed", { reason: error }), "SIGN_OUT_FAILED", false);
    }

    return true;
  }

  /** Email from the current auth flow or session, if available. */
  getEmail(): string | null {
    return authState.email;
  }

  /** Whether the auth flow can navigate back to the previous step. */
  canGoBack(): boolean {
    return authStore.canGoBack();
  }

  /** Navigates the auth flow back one step. Returns whether the navigation was performed. */
  goBack(): boolean {
    return authStore.goBack();
  }

  /** Resets the auth flow to the initial step. */
  restart(): void {
    authStore.restart();
  }

  /** Current step identifier of the auth flow (e.g. "email", "magic_code"). */
  getCurrentStep(): string | undefined {
    return authState.step;
  }

  /** Builds an AuthError with the given message, code, and requiresReauth flag. */
  private createAuthError(message: string, code: AuthError["code"], requiresReauth = false): AuthError {
    const error = new Error(message) as AuthError;
    error.code = code;
    error.requiresReauth = requiresReauth;

    return error;
  }
}
