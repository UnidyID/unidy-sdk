import type { UnidyClient } from "@unidy.io/sdk-api-client";
import { jwtDecode } from "jwt-decode";
import { authStore, authState } from "./store/auth-store";

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
  code: "TOKEN_EXPIRED" | "REFRESH_FAILED" | "NO_TOKEN" | "INVALID_TOKEN";
  requiresReauth: boolean;
};

export class Auth {
  private static instance: Auth;

  private constructor(private client: UnidyClient) {}

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
    while (!Auth.isInitialized()) {
      await new Promise((r) => setTimeout(r, 10));
    }

    return Auth.instance;
  }

  static initialize(client: UnidyClient): Auth {
    Auth.instance = new Auth(client);

    if (Auth.instance.isTokenValid(authState.token)) {
      authStore.setAuthenticated(true);
    }

    return Auth.instance;
  }

  static isInitialized(): boolean {
    return !!Auth.instance;
  }

  async createSignIn(email: string) {
    if (!Auth.isInitialized()) {
      throw new Error("Auth not initialized");
    }

    if (!email) {
      throw new Error("Email is required");
    }

    authStore.setLoading(true);
    authStore.setError(null);

    const [error, response] = await this.client.auth.createSignIn(email);

    if (error) {
      authStore.setError(error);
      authStore.setLoading(false);
    } else {
      authStore.setStep("verification");
      authStore.setEmail(email);
      authStore.setSignInId(response.sid);
      authStore.setMagicCodeSent(false);
      authStore.setMagicCode("");
      authStore.setLoading(false);
    }
  }

  async authenticateWithPassword(password: string) {
    if (!authState.sid) {
      throw new Error("No sign in ID available");
    }

    if (!password) {
      throw new Error("Password is missing");
    }

    authStore.setLoading(true);
    authStore.setError(null);

    const [error, response] = await this.client.auth.authenticateWithPassword(authState.sid, password);

    if (error) {
      authStore.setError(error);
      authStore.setLoading(false);
    } else {
      authStore.setToken(response.jwt);
      authStore.setRefreshToken(response.refresh_token);
      authStore.setLoading(false);

      authStore.getRootComponentRef()?.onAuth(response);
    }
  }

  async sendMagicCode() {
    if (!authState.sid) {
      throw new Error("No sign in ID available");
    }

    authStore.setMagicCodeRequested(true);
    authStore.setLoading(true);
    authStore.setError(null);

    const [error, response] = await this.client.auth.sendMagicCode(authState.sid);

    authStore.setMagicCodeRequested(false);

    authStore.setLoading(false);
    if (error) {
      if (error === "magic_code_recently_created") {
        authStore.setMagicCodeSent(true);
        authStore.setEnableResendMagicCodeAfter(response.enable_resend_after);
      }

      authStore.setError(error);
      authStore.setStep("magic-code");
    } else {
      authStore.setMagicCodeSent(true);
      authStore.setEnableResendMagicCodeAfter(response.enable_resend_after);
      authStore.setStep("magic-code");
    }
  }

  async authenticateWithMagicCode(code: string) {
    if (!authState.sid) {
      throw new Error("No sign in ID available");
    }

    if (!code) {
      throw new Error("Magic code is missing");
    }

    authStore.setLoading(true);
    authStore.setError(null);

    const [error, response] = await this.client.auth.authenticateWithMagicCode(authState.sid, code);

    if (error) {
      authStore.setError(error);
      authStore.setLoading(false);
    } else {
      authStore.setToken(response.jwt);
      authStore.setRefreshToken(response.refresh_token);
      authStore.setLoading(false);

      authStore.getRootComponentRef()?.onAuth(response);
    }
  }

  async sendResetPasswordEmail() {
    if (!authState.sid) {
      throw new Error("No sign in ID available");
    }

    authStore.setLoading(true);
    authStore.setResetPasswordSent(false);

    const [error, _] = await this.client.auth.sendResetPasswordEmail(authState.sid);

    if (error) {
      authStore.setError(error);
      authStore.setLoading(false);
    } else {
      authStore.setResetPasswordSent(true);
      authStore.setLoading(false);
      authStore.setError(null);
    }
  }

  extractRefreshTokenFromQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const refreshToken = urlParams.get("refresh_token") || null;
    const sid = urlParams.get("sid") || null;

    if (refreshToken && sid) {
      authStore.setRefreshToken(refreshToken);
      authStore.setSignInId(sid);

      urlParams.delete("refresh_token");
      urlParams.delete("sid");
      const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }
  }

  async refreshToken() {
    this.extractRefreshTokenFromQuery();

    if (!authState.refreshToken) {
      return this.createAuthError("Token expired and no refresh token available. Please sign in again.", "TOKEN_EXPIRED", true);
    }

    const [error, response] = await this.client.auth.refreshToken(authState.sid as string, authState.refreshToken);

    if (error) {
      authStore.setError(error);
    } else {
      authStore.setToken(response.jwt);
      authStore.setRefreshToken(response.refresh_token);
    }
  }

  isTokenValid(token: string | TokenPayload | null): boolean {
    try {
      let decoded: TokenPayload | null;

      if (typeof token === "string") {
        decoded = jwtDecode<TokenPayload>(token);
      } else {
        decoded = token;
      }

      if (!decoded) return false;

      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
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

    await this.refreshToken();

    if (authState.error || !authState.token) {
      return this.createAuthError("Failed to refresh token. Please sign in again.", "REFRESH_FAILED", true);
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
      return null;
    }
  }

  logout() {
    authStore.reset();
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
