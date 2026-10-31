import { t } from "../../../i18n";

/**
 * Error codes u-raw-field stores when client-side validation fails. Messages from integrators
 * (`pattern-error-message`, `invalid-phone-message`, `validationFunc`) and from the server are stored as they are.
 */
export const CLIENT_VALIDATION_ERROR_CODES: ReadonlySet<string> = new Set([
  "field_required",
  "invalid_format",
  "invalid_input",
  "invalid_phone",
  "passwords_do_not_match",
]);

/** Translates an error code produced by u-raw-field and returns every other error unchanged. */
export function fieldErrorMessage(error: string): string {
  return CLIENT_VALIDATION_ERROR_CODES.has(error) ? t(`errors.${error}`, { defaultValue: error }) : error;
}

// The strings the backend's boolean coercion (dry-types Params::Bool) reads as true
const CONSENT_GIVEN_STRINGS: ReadonlySet<string> = new Set([
  "1",
  "on",
  "On",
  "ON",
  "t",
  "true",
  "True",
  "TRUE",
  "T",
  "y",
  "yes",
  "Yes",
  "YES",
  "Y",
]);

/**
 * Whether a stored consent value counts as given. The profile and newsletter stores hold `true` or `null`, but
 * registration data restored from the server is stored uncast and can hold any string the backend accepts as true.
 */
export function isConsentGiven(value: unknown): boolean {
  return value === true || value === 1 || (typeof value === "string" && CONSENT_GIVEN_STRINGS.has(value));
}
