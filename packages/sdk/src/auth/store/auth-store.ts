import { createStore } from "@stencil/store";
import { unidyState } from "../../shared/store/unidy-store";
import type { LoginOptions, RequiredFieldsResponse } from "../api/auth";
import type { SigninRoot } from "../components/signin-root/signin-root";
import { AUTH_ERROR_CODES } from "../error-definitions";

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

  // recovery and navigation related state
  _pendingRecoveryStep: AuthStep | null;
  _stepHistory: AuthStep[];
  _initialStep: AuthStep | null;
}

const SESSION_KEYS = {
  SID: "unidy_signin_id",
  TOKEN: "unidy_token",
  REFRESH_TOKEN: "unidy_refresh_token",
  EMAIL: "unidy_email",
  STEP: "unidy_step",
  LOGIN_OPTIONS: "unidy_login_options",
  MAGIC_CODE_STEP: "unidy_magic_code_step",
} as const;

const saveToStorage = (storage: Storage, key: string, value: string | null) => {
  if (value) {
    storage.setItem(key, value);
  } else {
    storage.removeItem(key);
  }
};

const loadJsonFromStorage = <T>(storage: Storage, key: string): T | null => {
  const value = storage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const saveJsonToStorage = <T>(storage: Storage, key: string, value: T | null) => {
  if (value) {
    storage.setItem(key, JSON.stringify(value));
  } else {
    storage.removeItem(key);
  }
};

const RECOVERABLE_STEPS: AuthStep[] = ["verification", "magic-code"];

const isRecoverableStep = (step: AuthStep | undefined): step is AuthStep => {
  return step !== undefined && RECOVERABLE_STEPS.includes(step);
};

const getStoredStep = (): AuthStep | null => {
  try {
    return localStorage.getItem(SESSION_KEYS.STEP) as AuthStep | null;
  } catch {
    return null;
  }
};

const getStoredLoginOptions = (): LoginOptions | null => {
  try {
    return loadJsonFromStorage<LoginOptions>(localStorage, SESSION_KEYS.LOGIN_OPTIONS);
  } catch {
    return null;
  }
};

const getStoredMagicCodeStep = (): AuthState["magicCodeStep"] => {
  try {
    return localStorage.getItem(SESSION_KEYS.MAGIC_CODE_STEP) as AuthState["magicCodeStep"];
  } catch {
    return null;
  }
};

const storedStep = getStoredStep();
const storedLoginOptions = getStoredLoginOptions();
const storedMagicCodeStep = getStoredMagicCodeStep();

const initialState: AuthState = {
  step: undefined,
  email: localStorage.getItem(SESSION_KEYS.EMAIL) ?? "",
  password: "",
  magicCodeStep: storedMagicCodeStep,
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
  availableLoginOptions: storedLoginOptions ?? {
    magic_link: false,
    password: false,
    social_logins: [],
    passkey: true,
  },
  token: sessionStorage.getItem(SESSION_KEYS.TOKEN),
  refreshToken: localStorage.getItem(SESSION_KEYS.REFRESH_TOKEN),
  backendSignedIn: false,

  _pendingRecoveryStep: isRecoverableStep(storedStep) ? storedStep : null,
  _stepHistory: [],
  _initialStep: null,
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
    if (state._initialStep === null) {
      state._initialStep = step;
    }
    if (state.step === undefined) {
      state.step = step;
    }
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
    saveJsonToStorage(localStorage, SESSION_KEYS.LOGIN_OPTIONS, availableLoginOptions);
  }

  setLoading(loading: boolean) {
    state.loading = loading;
  }

  setFieldError(field: "email" | "password" | "magicCode" | "resetPassword" | "passkey", error: string | null) {
    if (!this.handleGeneralError(error)) return;

    state.errors = { ...state.errors, [field]: error };
  }

  setGlobalError(key: string, error: string | null) {
    if (!this.handleGeneralError(error)) return;
    state.globalErrors = { ...state.globalErrors, [key]: error };
  }

  private handleGeneralError(error: string | null): boolean {
    if (!error) return true;

    if (error === "connection_failed") {
      unidyState.backendConnected = false;
      return false;
    }

    if (
      error === AUTH_ERROR_CODES.GENERAL.SIGN_IN_NOT_FOUND ||
      error === AUTH_ERROR_CODES.GENERAL.SIGN_IN_ALREADY_PROCESSED ||
      error === AUTH_ERROR_CODES.GENERAL.SIGN_IN_EXPIRED
    ) {
      // Preserve email so user can retry without re-entering
      const email = state.email;
      this.reset();
      state.email = email;
      saveToStorage(localStorage, SESSION_KEYS.EMAIL, email);
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

  setStep(step: AuthStep, addToHistory = true) {
    if (addToHistory && state.step !== undefined && state.step !== step) {
      state._stepHistory = [...state._stepHistory, state.step];
    }

    state.step = step;
    if (isRecoverableStep(step)) {
      saveToStorage(localStorage, SESSION_KEYS.STEP, step);
    } else {
      saveToStorage(localStorage, SESSION_KEYS.STEP, null);
    }
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
    saveToStorage(localStorage, SESSION_KEYS.MAGIC_CODE_STEP, step);
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

    // recovery-related storage
    saveToStorage(localStorage, SESSION_KEYS.STEP, null);
    saveToStorage(localStorage, SESSION_KEYS.LOGIN_OPTIONS, null);
    saveToStorage(localStorage, SESSION_KEYS.MAGIC_CODE_STEP, null);
  }

  getPendingRecoveryStep(): AuthStep | null {
    return state._pendingRecoveryStep;
  }

  applyRecoveryStep(): boolean {
    const pendingStep = state._pendingRecoveryStep;
    if (!pendingStep || !state.sid) {
      this.clearPendingRecovery();
      return false;
    }

    state.step = pendingStep;
    state._pendingRecoveryStep = null;
    return true;
  }

  clearPendingRecovery() {
    state._pendingRecoveryStep = null;
    saveToStorage(localStorage, SESSION_KEYS.STEP, null);
    saveToStorage(localStorage, SESSION_KEYS.MAGIC_CODE_STEP, null);
  }

  canGoBack(): boolean {
    return state._stepHistory.length > 0;
  }

  goBack(): boolean {
    if (state._stepHistory.length === 0) {
      return false;
    }

    const currentStep = state.step;
    const previousStep = state._stepHistory[state._stepHistory.length - 1];
    state._stepHistory = state._stepHistory.slice(0, -1);

    this.setStep(previousStep, false);

    // clear errors when going back
    this.clearErrors();

    // Clear magic code state when leaving magic-code step so a fresh request happens on re-entry
    if (currentStep === "magic-code" || previousStep === "email" || previousStep === "single-login") {
      state.magicCodeStep = null;
      saveToStorage(localStorage, SESSION_KEYS.MAGIC_CODE_STEP, null);
    }

    return true;
  }

  restart() {
    const initialStep = state._initialStep ?? "email";

    // Preserve user context for convenience
    const email = state.email;
    const loginOptions = state.availableLoginOptions;
    reset();

    state.email = email;
    saveToStorage(localStorage, SESSION_KEYS.EMAIL, email);

    state.availableLoginOptions = loginOptions;
    saveJsonToStorage(localStorage, SESSION_KEYS.LOGIN_OPTIONS, loginOptions);

    state.step = initialStep;
    state._initialStep = initialStep;
    state._stepHistory = [];
    state._pendingRecoveryStep = null;

    saveToStorage(localStorage, SESSION_KEYS.SID, null);
    saveToStorage(localStorage, SESSION_KEYS.REFRESH_TOKEN, null);
    saveToStorage(sessionStorage, SESSION_KEYS.TOKEN, null);
    saveToStorage(localStorage, SESSION_KEYS.STEP, null);
    saveToStorage(localStorage, SESSION_KEYS.MAGIC_CODE_STEP, null);
  }
}

export const authStore = new AuthStore();
export { state as authState, authStoreOnChange as onChange };
