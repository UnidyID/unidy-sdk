import type { HookCallbacks } from "../types";

export type AuthStep =
  | "idle"
  | "email"
  | "verification"
  | "password"
  | "magic-code"
  | "reset-password"
  | "connect-brand"
  | "missing-fields"
  | "authenticated";

export interface LoginOptions {
  magic_link: boolean;
  password: boolean;
  social_logins: string[];
  passkey: boolean;
}

export interface AuthErrors {
  email: string | null;
  password: string | null;
  magicCode: string | null;
  passkey: string | null;
  resetPassword: string | null;
  missingFields: string | null;
  global: string | null;
}

export interface AuthState {
  step: AuthStep;
  email: string;
  signInId: string | null;
  loginOptions: LoginOptions | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  errors: AuthErrors;
  magicCodeResendAfter: number | null;
  resetPasswordStep: "idle" | "sent";
  stepHistory: AuthStep[];
  /** Field definitions returned by the server when missing fields are required. Keys are field names, values are field metadata/defaults. */
  missingFieldDefinitions: Record<string, unknown> | null;
}

export type AuthAction =
  | { type: "SET_STEP"; step: AuthStep }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_SIGNIN_ID"; signInId: string }
  | { type: "SET_LOGIN_OPTIONS"; options: LoginOptions }
  | { type: "SET_ERROR"; field: keyof AuthErrors; message: string | null }
  | { type: "CLEAR_ERRORS" }
  | { type: "AUTH_SUCCESS"; token: string; refreshToken: string; signInId?: string }
  | { type: "LOGOUT" }
  | { type: "GO_BACK" }
  | { type: "RESTART" }
  | { type: "SET_MAGIC_CODE_RESEND_AFTER"; time: number | null }
  | { type: "SET_RESET_PASSWORD_STEP"; step: "idle" | "sent" }
  | { type: "RECOVER_STATE"; state: Partial<AuthState> }
  | { type: "RESET" }
  | { type: "SET_MISSING_FIELD_DEFINITIONS"; fields: Record<string, unknown> };

export interface UseLoginOptions {
  initialStep?: AuthStep;
  callbacks?: HookCallbacks;
  /** Auto-recover login flow state from storage on mount. Default: true */
  autoRecover?: boolean;
}

export interface UseLoginReturn {
  // State
  step: AuthStep;
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string;
  loginOptions: LoginOptions | null;
  errors: AuthErrors;
  /** @deprecated Use `resendAvailableIn` instead. Raw value from the server. */
  magicCodeResendAfter: number | null;
  /** Seconds remaining before the magic code can be resent. Ticks down automatically. 0 = can resend. */
  resendAvailableIn: number;
  resetPasswordStep: "idle" | "sent";
  canGoBack: boolean;
  /** Field definitions from the server when the "missing-fields" step is active. */
  missingFieldDefinitions: Record<string, unknown> | null;

  // Actions - Email
  submitEmail: (email: string, options?: { sendMagicCode?: boolean }) => Promise<void>;

  // Actions - Password
  submitPassword: (password: string) => Promise<void>;

  // Actions - Magic code
  sendMagicCode: () => Promise<void>;
  submitMagicCode: (code: string) => Promise<void>;

  // Actions - Social auth
  getSocialAuthUrl: (provider: string, redirectUri: string) => string;
  handleSocialAuthCallback: () => Promise<void>;

  // Actions - Passkey
  authenticateWithPasskey: () => Promise<void>;

  // Actions - Password reset
  sendResetPasswordEmail: (returnTo?: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmation: string) => Promise<void>;

  // Actions - Brand connection
  /** Accept the brand connection. Transitions to authenticated or missing-fields. */
  connectBrand: () => Promise<void>;
  /** Cancel the brand connection and return to the email step. Signs out the current session. */
  cancelBrandConnect: () => Promise<void>;
  /** Submit the missing required fields to complete authentication. */
  submitMissingFields: (fields: Record<string, unknown>) => Promise<void>;

  // Actions - Pending registration check
  /**
   * Check if a pending registration exists for the given email and optionally
   * send a resume link. Useful when `submitEmail` returns `account_not_found`.
   * Returns `"resume-link-sent"` if a pending registration was found and a
   * resume link was emailed, `"not-found"` if no registration exists, or
   * `"error"` on network/server failure.
   */
  checkPendingRegistration: (email: string) => Promise<"resume-link-sent" | "not-found" | "error">;

  // Navigation
  goBack: () => void;
  goToStep: (step: AuthStep) => void;
  /** Go back to email step, preserving email and loginOptions. */
  restart: () => void;
  /** Fully reset all login state to initial values (step, errors, history, email, etc.). */
  reset: () => void;
}

export interface UseSessionOptions {
  callbacks?: HookCallbacks;
  /** Auto-recover and hydrate authenticated session state from storage on mount. Default: true */
  autoRecover?: boolean;
}

export interface UseSessionReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string;
  signInId: string | null;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}
