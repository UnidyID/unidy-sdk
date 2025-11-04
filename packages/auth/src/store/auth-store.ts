import { createStore } from "@stencil/store";
import type { SigninRoot } from "../components/auth/signin-root/signin-root";

export interface AuthState {
  step: "email" | "verification" | "magic-code";
  sid: string | null;
  email: string;
  password: string;

  magicCodeStep: null | "requested" | "sent";
  resetPasswordStep: null | "requested" | "sent";
  enableResendMagicCodeAfter: number | null;

  loading: boolean;
  errors: Record<string, string | null>;
  globalErrors: Record<string, string | null>;

  authenticated: boolean;
  token: string | null;
}

const SESSION_KEYS = {
  SID: "unidy_signin_id",
  TOKEN: "unidy_token",
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
  magicCodeStep: null,
  resetPasswordStep: null,
  enableResendMagicCodeAfter: null,
  sid: localStorage.getItem(SESSION_KEYS.SID),
  loading: false,
  errors: {},
  globalErrors: {},
  authenticated: false,
  token: sessionStorage.getItem(SESSION_KEYS.TOKEN),
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

  setEnableResendMagicCodeAfter(enableResendMagicCodeAfter: number | null) {
    state.enableResendMagicCodeAfter = enableResendMagicCodeAfter;
  }

  setLoading(loading: boolean) {
    state.loading = loading;
  }

  setFieldError(field: string, error: string | null) {
    if (error) {
      this.rootComponentRef?.onError(error);
    }
    state.errors = { ...state.errors, [field]: error };
  }

  setGlobalError(key: string, error: string | null) {
    if (error) {
      this.rootComponentRef?.onError(error);
    }
    state.globalErrors = { ...state.globalErrors, [key]: error };
  }

  clearFieldError(field: string) {
    const { [field]: _, ...rest } = state.errors;
    state.errors = rest;
  }

  clearErrors() {
    state.errors = {};
    state.globalErrors = {};
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

  setMagicCodeStep(step: null | "requested" | "sent") {
    state.magicCodeStep = step;
    console.log("magicCodeStep", step);
  }

  setResetPasswordStep(step: null | "requested" | "sent") {
    state.resetPasswordStep = step;
  }

  setAuthenticated(authenticated: boolean) {
    state.authenticated = authenticated;

    if (!authenticated) {
      state.token = null;
      state.sid = null;
    }
  }

  reset() {
    reset();
    saveToStorage(localStorage, SESSION_KEYS.SID, null);
    saveToStorage(sessionStorage, SESSION_KEYS.TOKEN, null);
  }
}

export const authStore = new AuthStore();
export { state as authState, onChange };
