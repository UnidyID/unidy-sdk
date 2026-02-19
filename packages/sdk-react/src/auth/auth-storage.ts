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

interface AuthStorageState {
  token: string | null;
  refreshToken: string | null;
  signInId: string | null;
  email: string | null;
  step: AuthStep | null;
  loginOptions: LoginOptions | null;
  magicCodeStep: string | null;
}

function readStateFromStorage(): AuthStorageState {
  return {
    token: sessionStorage.getItem(KEYS.TOKEN),
    refreshToken: localStorage.getItem(KEYS.REFRESH_TOKEN),
    signInId: localStorage.getItem(KEYS.SIGNIN_ID),
    email: localStorage.getItem(KEYS.EMAIL),
    step: localStorage.getItem(KEYS.STEP) as AuthStep | null,
    loginOptions: safeJsonParse<LoginOptions>(localStorage.getItem(KEYS.LOGIN_OPTIONS)),
    magicCodeStep: localStorage.getItem(KEYS.MAGIC_CODE_STEP),
  };
}

const listeners = new Set<() => void>();
let state: AuthStorageState | null = null;

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

function ensureState(): AuthStorageState {
  if (typeof window === "undefined") {
    return {
      token: null,
      refreshToken: null,
      signInId: null,
      email: null,
      step: null,
      loginOptions: null,
      magicCodeStep: null,
    };
  }

  if (!state) {
    state = readStateFromStorage();
  }

  return state;
}

function emitAuthChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function syncStateFromStorage(): void {
  if (typeof window === "undefined") return;
  state = readStateFromStorage();
  emitAuthChange();
}

export const authStorage = {
  getState(): AuthStorageState {
    return ensureState();
  },

  // JWT access token (sessionStorage - more secure, session-only)
  getToken(): string | null {
    return ensureState().token;
  },
  setToken(token: string): void {
    sessionStorage.setItem(KEYS.TOKEN, token);
    state = { ...ensureState(), token };
    emitAuthChange();
  },
  clearToken(): void {
    sessionStorage.removeItem(KEYS.TOKEN);
    state = { ...ensureState(), token: null };
    emitAuthChange();
  },

  // Refresh token (localStorage - survives tab close)
  getRefreshToken(): string | null {
    return ensureState().refreshToken;
  },
  setRefreshToken(token: string): void {
    localStorage.setItem(KEYS.REFRESH_TOKEN, token);
    state = { ...ensureState(), refreshToken: token };
    emitAuthChange();
  },

  // Sign-in ID
  getSignInId(): string | null {
    return ensureState().signInId;
  },
  setSignInId(sid: string): void {
    localStorage.setItem(KEYS.SIGNIN_ID, sid);
    state = { ...ensureState(), signInId: sid };
    emitAuthChange();
  },

  // Email
  getEmail(): string | null {
    return ensureState().email;
  },
  setEmail(email: string): void {
    localStorage.setItem(KEYS.EMAIL, email);
    state = { ...ensureState(), email };
    emitAuthChange();
  },

  // Recoverable auth step
  getRecoverableStep(): AuthStep | null {
    return ensureState().step;
  },
  setRecoverableStep(step: AuthStep | null): void {
    setOrRemove(localStorage, KEYS.STEP, step);
    state = { ...ensureState(), step };
    emitAuthChange();
  },

  // Login options (JSON in localStorage)
  getLoginOptions(): LoginOptions | null {
    return ensureState().loginOptions;
  },
  setLoginOptions(options: LoginOptions): void {
    localStorage.setItem(KEYS.LOGIN_OPTIONS, JSON.stringify(options));
    state = { ...ensureState(), loginOptions: options };
    emitAuthChange();
  },

  // Magic code step
  getMagicCodeStep(): string | null {
    return ensureState().magicCodeStep;
  },
  setMagicCodeStep(step: string | null): void {
    setOrRemove(localStorage, KEYS.MAGIC_CODE_STEP, step);
    state = { ...ensureState(), magicCodeStep: step };
    emitAuthChange();
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
    state = {
      token: null,
      refreshToken: null,
      signInId: null,
      email: null,
      step: null,
      loginOptions: null,
      magicCodeStep: null,
    };
    emitAuthChange();
  },

  subscribe(onChange: () => void): () => void {
    listeners.add(onChange);

    if (typeof window === "undefined") {
      return () => {
        listeners.delete(onChange);
      };
    }

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (!Object.values(KEYS).includes(event.key as (typeof KEYS)[keyof typeof KEYS])) return;
      syncStateFromStorage();
    };

    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  },
} as const;
