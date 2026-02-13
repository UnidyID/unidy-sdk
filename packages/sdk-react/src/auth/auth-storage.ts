import type { AuthStep, LoginOptions } from "./types";

/** Storage keys matching the Stencil SDK's auth-store.ts */
const KEYS = {
  TOKEN: "unidy_token",
  REFRESH_TOKEN: "unidy_refresh_token",
  SIGNIN_ID: "unidy_signin_id",
  EMAIL: "unidy_email",
  STEP: "unidy_step",
  LOGIN_OPTIONS: "unidy_login_options",
  MAGIC_CODE_STEP: "unidy_magic_code_step",
} as const;

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function setOrRemove(storage: Storage, key: string, value: string | null): void {
  if (value) {
    storage.setItem(key, value);
  } else {
    storage.removeItem(key);
  }
}

export const authStorage = {
  // JWT access token (sessionStorage - more secure, session-only)
  getToken(): string | null {
    return sessionStorage.getItem(KEYS.TOKEN);
  },
  setToken(token: string): void {
    sessionStorage.setItem(KEYS.TOKEN, token);
  },
  clearToken(): void {
    sessionStorage.removeItem(KEYS.TOKEN);
  },

  // Refresh token (localStorage - survives tab close)
  getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  },
  setRefreshToken(token: string): void {
    localStorage.setItem(KEYS.REFRESH_TOKEN, token);
  },

  // Sign-in ID
  getSignInId(): string | null {
    return localStorage.getItem(KEYS.SIGNIN_ID);
  },
  setSignInId(sid: string): void {
    localStorage.setItem(KEYS.SIGNIN_ID, sid);
  },

  // Email
  getEmail(): string | null {
    return localStorage.getItem(KEYS.EMAIL);
  },
  setEmail(email: string): void {
    localStorage.setItem(KEYS.EMAIL, email);
  },

  // Recoverable auth step
  getRecoverableStep(): AuthStep | null {
    return localStorage.getItem(KEYS.STEP) as AuthStep | null;
  },
  setRecoverableStep(step: AuthStep | null): void {
    setOrRemove(localStorage, KEYS.STEP, step);
  },

  // Login options (JSON in localStorage)
  getLoginOptions(): LoginOptions | null {
    return safeJsonParse<LoginOptions>(localStorage.getItem(KEYS.LOGIN_OPTIONS));
  },
  setLoginOptions(options: LoginOptions): void {
    localStorage.setItem(KEYS.LOGIN_OPTIONS, JSON.stringify(options));
  },

  // Magic code step
  getMagicCodeStep(): string | null {
    return localStorage.getItem(KEYS.MAGIC_CODE_STEP);
  },
  setMagicCodeStep(step: string | null): void {
    setOrRemove(localStorage, KEYS.MAGIC_CODE_STEP, step);
  },

  /** Clear all auth-related storage keys. Used on logout. */
  clearAll(): void {
    sessionStorage.removeItem(KEYS.TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.SIGNIN_ID);
    localStorage.removeItem(KEYS.EMAIL);
    localStorage.removeItem(KEYS.STEP);
    localStorage.removeItem(KEYS.LOGIN_OPTIONS);
    localStorage.removeItem(KEYS.MAGIC_CODE_STEP);
  },
} as const;
