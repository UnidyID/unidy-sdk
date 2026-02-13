import type { HookCallbacks } from "../types";

export type AuthStep = "idle" | "email" | "verification" | "password" | "magic-code" | "reset-password" | "authenticated";

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
  resetPassword: string | null;
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
  | { type: "RECOVER_STATE"; state: Partial<AuthState> };

export interface UseAuthOptions {
  initialStep?: AuthStep;
  callbacks?: HookCallbacks;
  /** Auto-recover auth state from storage on mount. Default: true */
  autoRecover?: boolean;
}

export interface UseAuthReturn {
  // State
  step: AuthStep;
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string;
  loginOptions: LoginOptions | null;
  errors: AuthErrors;
  magicCodeResendAfter: number | null;
  resetPasswordStep: "idle" | "sent";
  canGoBack: boolean;

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

  // Actions - Password reset
  sendResetPasswordEmail: (returnTo?: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmation: string) => Promise<void>;

  // Navigation
  goBack: () => void;
  goToStep: (step: AuthStep) => void;
  restart: () => void;

  // Session
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}
