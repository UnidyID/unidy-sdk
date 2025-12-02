import { createStore } from "@stencil/store";
import type { SigninRoot } from "../components/signin-root/signin-root";
import type { RequiredFieldsResponse } from "../api/auth";
import type { ProfileNode } from "../../profile";

export interface AuthState {
  step: "email" | "verification" | "magic-code" | "missing-fields";
  sid: string | null;
  email: string;
  password: string;

  magicCodeStep: null | "requested" | "sent";
  resetPasswordStep: null | "requested" | "sent";
  missingRequiredFields?: RequiredFieldsResponse["fields"];

  loading: boolean;
  errors: Record<string, string | null>;
  globalErrors: Record<string, string | null>;

  authenticated: boolean;
  token: string | null;
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
  sid: localStorage.getItem(SESSION_KEYS.SID),
  loading: false,
  errors: {},
  globalErrors: {},
  authenticated: false,
  missingRequiredFields: undefined,
  token: sessionStorage.getItem(SESSION_KEYS.TOKEN),
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

  setEmail(email: string) {
    state.email = email;
  }

  setPassword(password: string) {
    state.password = password;
  }

  setMissingFields(fields: RequiredFieldsResponse["fields"]) {
    state.missingRequiredFields = fields;
  }

  setLoading(loading: boolean) {
    state.loading = loading;
  }

  setFieldError(field: string, error: string | null) {
    if (!this.handleError(error)) return;

    state.errors = { ...state.errors, [field]: error };
  }

  setGlobalError(key: string, error: string | null) {
    if (!this.handleError(error)) return;
    state.globalErrors = { ...state.globalErrors, [key]: error };
  }

  private handleError(error: string | null): boolean {
    if (!error) return true;

    if (error === "sign_in_not_found") {
      this.reset();
      return false;
    }

    this.rootComponentRef?.onError(error);
    return true;
  }

  clearFieldError(field: string) {
    const { [field]: _, ...rest } = state.errors;
    state.errors = rest;
  }

  clearErrors() {
    state.errors = {};
    state.globalErrors = {};
  }

  setStep(step: "email" | "verification" | "magic-code" | "missing-fields") {
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
export { state as authState, authStoreOnChange as onChange };
