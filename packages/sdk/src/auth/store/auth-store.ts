import { createStore } from "@stencil/store";
import type { ProfileNode } from "../../profile";
import { unidyState } from "../../shared/store/unidy-store";
import type { LoginOptions, RequiredFieldsResponse } from "../api/auth";
import type { SigninRoot } from "../components/signin-root/signin-root";

export type AuthStep = "email" | "verification" | "magic-code" | "missing-fields" | "reset-password" | "registration" | "single-login";

export interface AuthState {
  step: AuthStep;
  sid: string | null;
  email: string;
  password: string;

  magicCodeStep: null | "requested" | "sent";
  resetPassword: {
    step: null | "requested" | "sent" | "completed";
    token: string | null;
    newPassword: string;
    passwordConfirmation: string;
  };
  missingRequiredFields?: RequiredFieldsResponse["fields"];
  availableLoginOptions: LoginOptions | null;

  loading: boolean;
  errors: Record<"email" | "password" | "magicCode" | "resetPassword" | "passkey", string | null>;
  globalErrors: Record<string, string | null>;

  authenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  backendSignedIn: boolean;
}

const missingRequiredUserDefaultFields = () => {
  const fields = store.state.missingRequiredFields ?? ({} as RequiredFieldsResponse["fields"]);
  const { custom_attributes, ...missingRequiredUserDefaultFields } = fields;
  return missingRequiredUserDefaultFields as Record<string, ProfileNode>;
};

const missingRequiredCustomAttributeFields = () => {
  const fields = store.state.missingRequiredFields ?? ({} as RequiredFieldsResponse["fields"]);
  return (fields?.custom_attributes ?? {}) as Record<string, ProfileNode>;
};

export const missingFieldNames = () => {
  const userDefaultFields = Object.keys(missingRequiredUserDefaultFields());
  const ca = Object.keys(missingRequiredCustomAttributeFields()).map((k) => `custom_attributes.${k}`);
  return [...userDefaultFields, ...ca];
};

const SESSION_KEYS = {
  SID: "unidy_signin_id",
  TOKEN: "unidy_token",
  REFRESH_TOKEN: "unidy_refresh_token",
  EMAIL: "unidy_email",
} as const;

const saveToStorage = (storage: Storage, key: string, value: string | null) => {
  if (value) {
    storage.setItem(key, value);
  } else {
    storage.removeItem(key);
  }
};

const initialState: AuthState = {
  step: undefined,
  email: localStorage.getItem(SESSION_KEYS.EMAIL) ?? "",
  password: "",
  magicCodeStep: null,
  resetPassword: {
    step: null,
    token: null,
    newPassword: "",
    passwordConfirmation: "",
  },
  sid: localStorage.getItem(SESSION_KEYS.SID),
  loading: false,
  errors: {
    email: null,
    password: null,
    magicCode: null,
    resetPassword: null,
    passkey: null,
  },
  globalErrors: {},
  authenticated: false,
  missingRequiredFields: undefined,
  availableLoginOptions: {
    magic_link: false,
    password: false,
    social_logins: [],
    passkey: true,
  },
  token: sessionStorage.getItem(SESSION_KEYS.TOKEN),
  refreshToken: localStorage.getItem(SESSION_KEYS.REFRESH_TOKEN),
  backendSignedIn: false,
};

const store = createStore<AuthState>(initialState);
const { state, reset } = store;

const authStoreOnChange: <K extends keyof AuthState>(prop: K, cb: (value: AuthState[K]) => void) => () => void = store.onChange;

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

  setInitialStep(step: AuthStep) {
    if (state.step === undefined) state.step = step;
  }

  setEmail(email: string) {
    state.email = email;
    state.errors.email = null;
    saveToStorage(localStorage, SESSION_KEYS.EMAIL, email);
  }

  setPassword(password: string) {
    state.password = password;
    state.errors.password = null;
  }

  setMissingFields(fields: RequiredFieldsResponse["fields"]) {
    state.missingRequiredFields = fields;
  }

  setLoginOptions(availableLoginOptions: LoginOptions) {
    state.availableLoginOptions = availableLoginOptions;
  }

  setLoading(loading: boolean) {
    state.loading = loading;
  }

  setFieldError(field: "email" | "password" | "magicCode" | "resetPassword" | "passkey", error: string | null) {
    if (!this.handleError(error)) return;

    state.errors = { ...state.errors, [field]: error };
  }

  setGlobalError(key: string, error: string | null) {
    if (!this.handleError(error)) return;
    state.globalErrors = { ...state.globalErrors, [key]: error };
  }

  private handleError(error: string | null): boolean {
    if (!error) return true;

    if (error === "connection_failed") {
      unidyState.backendConnected = false;
      return false;
    }

    if (error === "sign_in_not_found") {
      this.reset();
      return false;
    }

    this.rootComponentRef?.onError(error);
    return true;
  }

  clearFieldError(field: "email" | "password" | "magicCode" | "resetPassword" | "passkey") {
    state.errors = { ...state.errors, [field]: null } as Record<
      "email" | "password" | "magicCode" | "resetPassword" | "passkey",
      string | null
    >;
  }

  clearErrors() {
    state.errors = initialState.errors;
    state.globalErrors = {};
  }

  setStep(step: AuthStep) {
    state.step = step;
  }

  setSignInId(signInId: string) {
    state.sid = signInId;
    saveToStorage(localStorage, SESSION_KEYS.SID, signInId);
  }

  setBackendSignedIn(backendSignedIn: boolean) {
    state.backendSignedIn = backendSignedIn;
  }

  setToken(token: string) {
    state.token = token;
    saveToStorage(sessionStorage, SESSION_KEYS.TOKEN, token);
    this.setAuthenticated(!!token);
  }

  setRefreshToken(refreshToken: string | null) {
    state.refreshToken = refreshToken;
    saveToStorage(localStorage, SESSION_KEYS.REFRESH_TOKEN, refreshToken);
  }

  setMagicCodeStep(step: null | "requested" | "sent") {
    state.magicCodeStep = step;
  }

  setResetPasswordStep(step: null | "requested" | "sent" | "completed") {
    state.resetPassword = { ...state.resetPassword, step };
  }

  setResetToken(token: string | null) {
    state.resetPassword = { ...state.resetPassword, token };
  }

  setNewPassword(password: string) {
    state.resetPassword = { ...state.resetPassword, newPassword: password };
  }

  setConfirmPassword(password: string) {
    state.resetPassword = { ...state.resetPassword, passwordConfirmation: password };
  }

  updateResetPassword(updates: Partial<AuthState["resetPassword"]>) {
    state.resetPassword = { ...state.resetPassword, ...updates };
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
    saveToStorage(localStorage, SESSION_KEYS.EMAIL, null);
    saveToStorage(localStorage, SESSION_KEYS.REFRESH_TOKEN, null);
    saveToStorage(sessionStorage, SESSION_KEYS.TOKEN, null);
  }
}

export const authStore = new AuthStore();
export { state as authState, authStoreOnChange as onChange };
