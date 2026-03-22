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
  REGISTRATION_RID: "unidy_registration_rid",
  REGISTRATION_EMAIL: "unidy_registration_email",
} as const;

interface AuthStorageState {
  token: string | null;
  refreshToken: string | null;
  signInId: string | null;
  email: string | null;
  step: AuthStep | null;
  loginOptions: LoginOptions | null;
  magicCodeStep: string | null;
  registrationRid: string | null;
  registrationEmail: string | null;
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
    registrationRid: localStorage.getItem(KEYS.REGISTRATION_RID),
    registrationEmail: localStorage.getItem(KEYS.REGISTRATION_EMAIL),
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

/** Stable empty state returned during SSR and hydration. */
const SERVER_STATE: AuthStorageState = {
  token: null,
  refreshToken: null,
  signInId: null,
  email: null,
  step: null,
  loginOptions: null,
  magicCodeStep: null,
  registrationRid: null,
  registrationEmail: null,
};

function ensureState(): AuthStorageState {
  if (typeof window === "undefined") {
    return SERVER_STATE;
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

  /**
   * Returns a stable empty snapshot for use as the server/hydration snapshot
   * in `useSyncExternalStore`. This ensures the server render and the client
   * hydration render produce the same output, avoiding hydration mismatches.
   */
  getServerState(): AuthStorageState {
    return SERVER_STATE;
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

  // Registration flow persistence
  getRegistrationRid(): string | null {
    return ensureState().registrationRid;
  },
  setRegistrationRid(rid: string | null): void {
    setOrRemove(localStorage, KEYS.REGISTRATION_RID, rid);
    state = { ...ensureState(), registrationRid: rid };
    emitAuthChange();
  },
  getRegistrationEmail(): string | null {
    return ensureState().registrationEmail;
  },
  setRegistrationEmail(email: string | null): void {
    setOrRemove(localStorage, KEYS.REGISTRATION_EMAIL, email);
    state = { ...ensureState(), registrationEmail: email };
    emitAuthChange();
  },
  clearRegistration(): void {
    localStorage.removeItem(KEYS.REGISTRATION_RID);
    localStorage.removeItem(KEYS.REGISTRATION_EMAIL);
    state = { ...ensureState(), registrationRid: null, registrationEmail: null };
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
    localStorage.removeItem(KEYS.REGISTRATION_RID);
    localStorage.removeItem(KEYS.REGISTRATION_EMAIL);
    state = {
      token: null,
      refreshToken: null,
      signInId: null,
      email: null,
      step: null,
      loginOptions: null,
      magicCodeStep: null,
      registrationRid: null,
      registrationEmail: null,
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
