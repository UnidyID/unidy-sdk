import { createStore } from "@stencil/store";
import type { RegistrationFlowResponse } from "../../auth/api/register";
import type { RegistrationRoot } from "../components/registration-root/registration-root";
import { unidyState } from "../../shared/store/unidy-store";

export interface RegistrationState {
  // Flow state
  rid: string | null;
  currentStepIndex: number;
  currentStepName: string;
  steps: string[];

  // Field values
  email: string;
  password: string;
  passwordlessFlag: boolean;
  profileData: Record<string, unknown>;
  customAttributes: Record<string, unknown>;
  newsletterPreferences: Record<string, string[]>;

  // Email verification
  emailVerified: boolean;
  verificationCodeSent: boolean;
  enableResendAfter: number;

  // Resume flow
  emailAlreadyInFlow: boolean;
  resumeEmailSent: boolean;

  // UI state
  loading: boolean;
  submitting: boolean;
  errors: Record<string, string | null>;
  globalErrors: Record<string, string | null>;

  // API response
  flowResponse: RegistrationFlowResponse | null;
  canFinalize: boolean;
  socialProvider: string | null;
  hasPassword: boolean | null;
}

const SESSION_KEYS = {
  RID: "unidy_registration_id",
} as const;

const saveToStorage = (storage: Storage, key: string, value: string | null) => {
  if (value) {
    storage.setItem(key, value);
  } else {
    storage.removeItem(key);
  }
};

const initialState: RegistrationState = {
  rid: localStorage.getItem(SESSION_KEYS.RID),
  currentStepIndex: 0,
  currentStepName: "",
  steps: [],

  email: "",
  password: "",
  passwordlessFlag: false,
  profileData: {},
  customAttributes: {},
  newsletterPreferences: {},

  emailVerified: false,
  verificationCodeSent: false,
  enableResendAfter: 0,

  emailAlreadyInFlow: false,
  resumeEmailSent: false,

  loading: false,
  submitting: false,
  errors: {},
  globalErrors: {},

  flowResponse: null,
  canFinalize: false,
  socialProvider: null,
  hasPassword: null,
};

const store = createStore<RegistrationState>(initialState);
const { state, reset } = store;

const registrationStoreOnChange: <K extends keyof RegistrationState>(
  prop: K,
  cb: (value: RegistrationState[K]) => void,
) => () => void = store.onChange;

class RegistrationStore {
  private rootComponentRef: RegistrationRoot | null = null;

  setRootComponentRef(ref: RegistrationRoot) {
    this.rootComponentRef = ref;
  }

  getRootComponentRef() {
    return this.rootComponentRef;
  }

  get state() {
    return state;
  }

  // Step management
  setSteps(steps: string[]) {
    state.steps = steps;
    if (steps.length > 0 && !state.currentStepName) {
      state.currentStepName = steps[0];
      state.currentStepIndex = 0;
    }
  }

  setCurrentStepIndex(index: number) {
    state.currentStepIndex = index;
    if (state.steps[index]) {
      state.currentStepName = state.steps[index];
    }
  }

  setCurrentStepName(name: string) {
    state.currentStepName = name;
    const index = state.steps.indexOf(name);
    if (index >= 0) {
      state.currentStepIndex = index;
    }
  }

  goToNextStep() {
    if (state.currentStepIndex < state.steps.length - 1) {
      this.setCurrentStepIndex(state.currentStepIndex + 1);
    }
  }

  goToPreviousStep() {
    if (state.currentStepIndex > 0) {
      this.setCurrentStepIndex(state.currentStepIndex - 1);
    }
  }

  // Field values
  setEmail(email: string) {
    state.email = email;
  }

  setPassword(password: string) {
    state.password = password;
  }

  setPasswordlessFlag(flag: boolean) {
    state.passwordlessFlag = flag;
  }

  setProfileData(data: Record<string, unknown>) {
    state.profileData = { ...state.profileData, ...data };
  }

  setProfileField(field: string, value: unknown) {
    state.profileData = { ...state.profileData, [field]: value };
  }

  setCustomAttribute(key: string, value: unknown) {
    state.customAttributes = { ...state.customAttributes, [key]: value };
  }

  setNewsletterPreference(name: string, preferences: string[]) {
    state.newsletterPreferences = { ...state.newsletterPreferences, [name]: preferences };
  }

  // Registration ID
  setRid(rid: string) {
    state.rid = rid;
    saveToStorage(localStorage, SESSION_KEYS.RID, rid);
  }

  clearRid() {
    state.rid = null;
    saveToStorage(localStorage, SESSION_KEYS.RID, null);
  }

  // Email verification
  setEmailVerified(verified: boolean) {
    state.emailVerified = verified;
  }

  setVerificationCodeSent(sent: boolean) {
    state.verificationCodeSent = sent;
  }

  setEnableResendAfter(seconds: number) {
    state.enableResendAfter = seconds;
  }

  // Resume flow
  setEmailAlreadyInFlow(value: boolean) {
    state.emailAlreadyInFlow = value;
  }

  setResumeEmailSent(sent: boolean) {
    state.resumeEmailSent = sent;
  }

  // UI state
  setLoading(loading: boolean) {
    state.loading = loading;
  }

  setSubmitting(submitting: boolean) {
    state.submitting = submitting;
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

    if (error === "connection_failed") {
      unidyState.backendConnected = false;
      return false;
    }

    if (error === "registration_not_found" || error === "registration_expired") {
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

  // API response
  setFlowResponse(response: RegistrationFlowResponse | null) {
    state.flowResponse = response;
    if (response) {
      state.canFinalize = response.can_finalize;
      state.emailVerified = response.email_verified;
      state.socialProvider = response.social_provider;
      state.hasPassword = response.has_password;

      if (response.email) {
        state.email = response.email;
      }

      if (response.newsletter_preferences) {
        state.newsletterPreferences = response.newsletter_preferences;
      }

      if (response.registration_profile_data) {
        const { custom_attributes, ...profileData } = response.registration_profile_data as Record<string, unknown> & {
          custom_attributes?: Record<string, unknown>;
        };
        state.profileData = profileData;
        if (custom_attributes) {
          state.customAttributes = custom_attributes;
        }
      }
    }
  }

  setCanFinalize(canFinalize: boolean) {
    state.canFinalize = canFinalize;
  }

  setSocialProvider(provider: string | null) {
    state.socialProvider = provider;
  }

  setHasPassword(hasPassword: boolean | null) {
    state.hasPassword = hasPassword;
  }

  // Reset
  reset() {
    reset();
    saveToStorage(localStorage, SESSION_KEYS.RID, null);
  }
}

export const registrationStore = new RegistrationStore();
export { state as registrationState, registrationStoreOnChange as onChange };
