import { t } from "../i18n";
import { type ProfileRaw, state as profileState } from "./store/profile-store";

type FieldWrapper = { value?: unknown; required?: boolean };

/** Extracts the value from a field wrapper */
const extractValue = ([key, field]: [string, unknown]): [string, unknown] => [key, (field as FieldWrapper).value];

/** Checks if a required field is empty */
function isRequiredFieldEmpty(field: FieldWrapper | undefined): boolean {
  return field?.required === true && (field.value === "" || field.value === null);
}

/** Sets a validation error for a field and returns false */
function setFieldError(fieldName: string): false {
  profileState.errors = { [fieldName]: t("errors.required_field", { field: fieldName }) };
  return false;
}

/**
 * Validates required fields in the profile state.
 * If fieldsToValidate is provided, only those fields are checked.
 * Returns true if all (specified) required fields have values.
 */
export function validateRequiredFields(stateData: ProfileRaw, fieldsToValidate?: Set<string>): boolean {
  for (const key of Object.keys(stateData)) {
    if (key === "custom_attributes") continue;
    if (fieldsToValidate && !fieldsToValidate.has(key)) continue;

    if (isRequiredFieldEmpty(stateData[key])) {
      return setFieldError(key);
    }
  }

  for (const key of Object.keys(stateData.custom_attributes ?? {})) {
    const fieldName = `custom_attributes.${key}`;
    if (fieldsToValidate && !fieldsToValidate.has(fieldName)) continue;

    if (isRequiredFieldEmpty(stateData.custom_attributes?.[key])) {
      return setFieldError(fieldName);
    }
  }

  return true;
}

/**
 * Builds a payload from profile state data.
 * If fieldsToInclude is provided, only those fields are included.
 */
export function buildPayload(stateData: ProfileRaw, fieldsToInclude?: Set<string>): Record<string, unknown> {
  const regularFields = Object.fromEntries(
    Object.entries(stateData)
      .filter(([k]) => k !== "custom_attributes" && (!fieldsToInclude || fieldsToInclude.has(k)))
      .map(extractValue),
  );

  const customAttributes = Object.entries(stateData.custom_attributes ?? {})
    .filter(([k]) => !fieldsToInclude || fieldsToInclude.has(`custom_attributes.${k}`))
    .map(extractValue);

  if (customAttributes.length > 0) {
    return { ...regularFields, custom_attributes: Object.fromEntries(customAttributes) };
  }

  return regularFields;
}

export function hasProfileChanged(): boolean {
  const currentData = buildPayload(profileState.data);
  const savedData = buildPayload(profileState.configuration);
  return JSON.stringify(currentData) !== JSON.stringify(savedData);
}
