import { createStore } from "@stencil/store";
import type { SigninRoot } from "../components/signin-root/signin-root";

export interface AuthState {
  step: "email" | "verification";
  email: string;
  password: string;
  sid: string | null;
  loading: boolean;
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

const saveToLocalStorage = (key: string, value: string | null) => {
  if (value) {
    localStorage.setItem(key, value);
  } else {
    localStorage.removeItem(key);
  }
};

const initialState: AuthState = {
  step: "email",
  email: "",
  password: "",
  sid: localStorage.getItem(SESSION_KEYS.SID),
  loading: false,
  error: null,
  authenticated: !!localStorage.getItem(SESSION_KEYS.TOKEN),
  token: localStorage.getItem(SESSION_KEYS.TOKEN),
  refreshToken: localStorage.getItem(SESSION_KEYS.REFRESH_TOKEN),
};

const { state, reset } = createStore<AuthState>(initialState);

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

  setLoading(loading: boolean) {
    state.loading = loading;
  }

  setError(error: string | null) {
    if (error) {
      this.rootComponentRef?.onError(error);
    }
    state.error = error;
  }

  setStep(step: "email" | "verification") {
    state.step = step;
  }

  setSignInId(signInId: string | null) {
    state.sid = signInId;
    saveToLocalStorage(SESSION_KEYS.SID, signInId);
  }

  setAuthenticated(authenticated: boolean) {
    state.authenticated = authenticated;

    if (!authenticated) {
      this.setToken(null);
      this.setRefreshToken(null);
      this.setSignInId(null);
    }
  }

  setToken(token: string | null) {
    state.token = token;
    saveToLocalStorage(SESSION_KEYS.TOKEN, token);
  }

  setRefreshToken(refreshToken: string | null) {
    state.refreshToken = refreshToken;
    saveToLocalStorage(SESSION_KEYS.REFRESH_TOKEN, refreshToken);
  }

  reset() {
    reset();
    localStorage.removeItem(SESSION_KEYS.SID);
    localStorage.removeItem(SESSION_KEYS.TOKEN);
    localStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN);
  }
}

export const authStore = new AuthStore();
export { state as authState };
