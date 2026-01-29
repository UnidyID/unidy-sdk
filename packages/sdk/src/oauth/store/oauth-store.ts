import { createStore } from "@stencil/store";
import type { OAuthApplication } from "../api/oauth";

export type OAuthStep = "idle" | "loading" | "consent" | "submitting" | "redirecting" | "error";

export interface OAuthState {
  step: OAuthStep;
  clientId: string | null;

  // Consent data from API
  hasConsent: boolean;
  application: OAuthApplication | null;
  requiredFields: string[];
  missingFields: string[];

  // User input for missing fields
  fieldValues: Record<string, unknown>;

  // Flow options
  scopes: string[] | null;
  redirectUri: string | null;
  newtab: boolean;

  // Result
  token: string | null;
  error: string | null;

  // Loading states
  loading: boolean;
}

const initialState: OAuthState = {
  step: "idle",
  clientId: null,
  hasConsent: false,
  application: null,
  requiredFields: [],
  missingFields: [],
  fieldValues: {},
  scopes: null,
  redirectUri: null,
  newtab: false,
  token: null,
  error: null,
  loading: false,
};

// Global OAuth store
const { state: oauthState, onChange, reset } = createStore<OAuthState>({ ...initialState });

export { oauthState, onChange };

export function resetOAuthState() {
  reset();
}

export function setOAuthClientId(clientId: string) {
  oauthState.clientId = clientId;
}

export function setOAuthOptions(options: { scopes?: string[] | null; redirectUri?: string | null; newtab?: boolean }) {
  if (options.scopes !== undefined) oauthState.scopes = options.scopes;
  if (options.redirectUri !== undefined) oauthState.redirectUri = options.redirectUri;
  if (options.newtab !== undefined) oauthState.newtab = options.newtab;
}

export function setOAuthStep(step: OAuthStep) {
  oauthState.step = step;
}

export function setOAuthLoading(loading: boolean) {
  oauthState.loading = loading;
}

export function setOAuthConsentData(data: {
  hasConsent: boolean;
  application: OAuthApplication;
  requiredFields: string[];
  missingFields: string[];
}) {
  oauthState.hasConsent = data.hasConsent;
  oauthState.application = data.application;
  oauthState.requiredFields = data.requiredFields;
  oauthState.missingFields = data.missingFields;
}

export function setOAuthFieldValue(field: string, value: unknown) {
  oauthState.fieldValues = { ...oauthState.fieldValues, [field]: value };
}

export function setOAuthToken(token: string) {
  oauthState.token = token;
}

export function setOAuthError(error: string | null) {
  oauthState.error = error;
  if (error) {
    oauthState.step = "error";
  }
}

export function clearOAuthError() {
  oauthState.error = null;
}

export function getOAuthFieldUpdates(): { user_updates: Record<string, unknown> } | null {
  const values = oauthState.fieldValues;
  if (Object.keys(values).length === 0) return null;

  const userUpdates: Record<string, unknown> = {};
  const customAttributes: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith("custom_attributes.")) {
      const attrName = key.replace("custom_attributes.", "");
      customAttributes[attrName] = value;
    } else {
      userUpdates[key] = value;
    }
  }

  if (Object.keys(customAttributes).length > 0) {
    userUpdates.custom_attributes = customAttributes;
  }

  return { user_updates: userUpdates };
}
