import { createStore } from "@stencil/store";
import type { SigninRoot } from "../components/auth/signin-root/signin-root";

export interface AuthState {
  step: "email" | "verification" | "magic-code";
  email: string;
  password: string;
  magicCode: string;
  magicCodeRequested: boolean;
  magicCodeSent: boolean;
  resetPasswordSent: boolean;
  enableResendMagicCodeAfter: number | null;
  sid: string | null;
  loading: boolean; // TODO refactor this or maybe remove loading state completely
  error: string | null;
  authenticated: boolean;
  token: string | null;
  refreshToken: string | null;
}

const SESSION_KEYS = {
  SID: "unidy_signin_id",
  TOKEN: "unidy_token",
  REFRESH_TOKEN: "unidy_refresh_token",
} as const;

const saveToStorage = (storage: Storage, key: string, value: string | null) => {
  if (value) {
    storage.setItem(key, value);
  } else {
    storage.removeItem(key);
  }
};

const initialState: AuthState = {
  step: "email",
  email: "",
  password: "",
  magicCode: "",
  magicCodeRequested: false,
  magicCodeSent: false,
  resetPasswordSent: false,
  enableResendMagicCodeAfter: null,
  sid: localStorage.getItem(SESSION_KEYS.SID),
  loading: false,
  error: null,
  authenticated: !!localStorage.getItem(SESSION_KEYS.TOKEN),
  token: localStorage.getItem(SESSION_KEYS.TOKEN),
  refreshToken: localStorage.getItem(SESSION_KEYS.REFRESH_TOKEN),
};

const { state, reset, onChange } = createStore<AuthState>(initialState);

class AuthStore {
  private rootComponentRef: SigninRoot | null = null;

  setRootComponentRef(ref: SigninRoot) {
    this.rootComponentRef = ref;
  }

  getRootComponentRef() {
    return this.rootComponentRef;
  }

  get state() {
    return state;
  }

  setEmail(email: string) {
    state.email = email;
  }

  setPassword(password: string) {
    state.password = password;
  }

  setMagicCode(magicCode: string) {
    state.magicCode = magicCode;
  }

  setMagicCodeRequested(requested: boolean) {
    state.magicCodeRequested = requested;
  }

  setMagicCodeSent(sent: boolean) {
    state.magicCodeSent = sent;
  }

  setEnableResendMagicCodeAfter(enableResendMagicCodeAfter: number | null) {
    state.enableResendMagicCodeAfter = enableResendMagicCodeAfter;
  }

  setLoading(loading: boolean) {
    state.loading = loading;
  }

  setError(error: string | null) {
    if (error) {
      this.rootComponentRef?.onError(error);
    }
    state.error = error;
  }

  setStep(step: "email" | "verification" | "magic-code") {
    state.step = step;
  }

  setSignInId(signInId: string) {
    state.sid = signInId;
    saveToStorage(localStorage, SESSION_KEYS.SID, signInId);
  }

  setToken(token: string) {
    state.token = token;
    saveToStorage(sessionStorage, SESSION_KEYS.TOKEN, token);
    this.setAuthenticated(!!token);
  }

  setRefreshToken(refreshToken: string) {
    state.refreshToken = refreshToken;
    saveToStorage(localStorage, SESSION_KEYS.REFRESH_TOKEN, refreshToken);
  }
  setResetPasswordSent(resetPasswordSent: boolean) {
    state.resetPasswordSent = resetPasswordSent;
  }

  setAuthenticated(authenticated: boolean) {
    state.authenticated = authenticated;

    if (!authenticated) {
      state.token = null;
      state.refreshToken = null;
      state.sid = null;
    }
  }

  reset() {
    reset();
    saveToStorage(localStorage, SESSION_KEYS.SID, null);
    saveToStorage(localStorage, SESSION_KEYS.REFRESH_TOKEN, null);
    saveToStorage(sessionStorage, SESSION_KEYS.TOKEN, null);
  }
}

export const authStore = new AuthStore();
export { state as authState, onChange };
