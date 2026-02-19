import { authStorage } from "./auth-storage";
import type { AuthAction, AuthErrors, AuthState } from "./types";

const INITIAL_ERRORS: AuthErrors = {
  email: null,
  password: null,
  magicCode: null,
  resetPassword: null,
  global: null,
};

export function createInitialState(initialStep: AuthState["step"] = "email"): AuthState {
  return {
    step: initialStep,
    email: "",
    signInId: null,
    loginOptions: null,
    isAuthenticated: false,
    token: null,
    isLoading: false,
    errors: { ...INITIAL_ERRORS },
    magicCodeResendAfter: null,
    resetPasswordStep: "idle",
    stepHistory: [],
  };
}

/** Steps that can be recovered after page reload */
const RECOVERABLE_STEPS = new Set(["verification", "magic-code"]);

export function isRecoverableStep(step: string): boolean {
  return RECOVERABLE_STEPS.has(step);
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_STEP": {
      const newHistory = state.step !== action.step ? [...state.stepHistory, state.step] : state.stepHistory;

      if (isRecoverableStep(action.step)) {
        authStorage.setRecoverableStep(action.step);
      } else {
        authStorage.setRecoverableStep(null);
      }

      return {
        ...state,
        step: action.step,
        stepHistory: newHistory,
        errors: { ...INITIAL_ERRORS },
      };
    }

    case "SET_LOADING":
      return { ...state, isLoading: action.loading };

    case "SET_EMAIL":
      return {
        ...state,
        email: action.email,
        errors: { ...state.errors, email: null },
      };

    case "SET_SIGNIN_ID":
      return { ...state, signInId: action.signInId };

    case "SET_LOGIN_OPTIONS":
      return { ...state, loginOptions: action.options };

    case "SET_ERROR":
      return {
        ...state,
        isLoading: false,
        errors: { ...state.errors, [action.field]: action.message },
      };

    case "CLEAR_ERRORS":
      return { ...state, errors: { ...INITIAL_ERRORS } };

    case "AUTH_SUCCESS": {
      authStorage.setToken(action.token);
      authStorage.setRefreshToken(action.refreshToken);
      if (action.signInId) {
        authStorage.setSignInId(action.signInId);
      }
      authStorage.setRecoverableStep(null);

      return {
        ...state,
        isAuthenticated: true,
        token: action.token,
        signInId: action.signInId ?? state.signInId,
        isLoading: false,
        step: "authenticated",
        stepHistory: [...state.stepHistory, state.step],
        errors: { ...INITIAL_ERRORS },
      };
    }

    case "LOGOUT": {
      authStorage.clearAll();
      return {
        ...createInitialState("email"),
        email: state.email,
      };
    }

    case "GO_BACK": {
      if (state.stepHistory.length === 0) return state;

      const previousStep = state.stepHistory[state.stepHistory.length - 1];

      if (isRecoverableStep(previousStep)) {
        authStorage.setRecoverableStep(previousStep);
      } else {
        authStorage.setRecoverableStep(null);
      }

      return {
        ...state,
        step: previousStep,
        stepHistory: state.stepHistory.slice(0, -1),
        errors: { ...INITIAL_ERRORS },
      };
    }

    case "RESTART": {
      authStorage.setRecoverableStep(null);
      authStorage.setMagicCodeStep(null);

      return {
        ...createInitialState("email"),
        email: state.email,
        loginOptions: state.loginOptions,
      };
    }

    case "SET_MAGIC_CODE_RESEND_AFTER":
      return { ...state, magicCodeResendAfter: action.time };

    case "SET_RESET_PASSWORD_STEP":
      return { ...state, resetPasswordStep: action.step };

    case "RECOVER_STATE":
      return { ...state, ...action.state };
  }
}
