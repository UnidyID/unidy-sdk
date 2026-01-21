import { t } from "../i18n";
import { type ProfileRaw, state as profileState } from "./store/profile-store";

export function validateRequiredFieldsUnchanged(sWC: ProfileRaw) {
  for (const key of Object.keys(sWC)) {
    if (key === "custom_attributes") continue;
    const field = sWC[key];
    if (field.required === true && (field.value === "" || field.value === null)) {
      profileState.errors = { [key]: t("errors.required_field", { field: key }) };
      return false;
    }
  }

  for (const key of Object.keys(sWC.custom_attributes ?? {})) {
    const field = sWC.custom_attributes?.[key];
    const fieldDisplayName = `custom_attributes.${key}`;
    if (field?.required === true && (field.value === "" || field.value === null)) {
      profileState.errors = { [fieldDisplayName]: t("errors.required_field", { field: fieldDisplayName }) };
      return false;
    }
  }

  return true;
}

export function buildPayload(stateData: ProfileRaw) {
  return {
    ...Object.fromEntries(
      Object.entries(stateData)
        .filter(([k]) => k !== "custom_attributes")
        .map(([k, v]: [string, unknown]) => [k, (v as { value: unknown }).value]),
    ),
    custom_attributes: Object.fromEntries(
      Object.entries(stateData.custom_attributes ?? {}).map(([k, v]: [string, unknown]) => [k, (v as { value: unknown }).value]),
    ),
  };
}

/**
 * Validates only the fields specified in fieldsToValidate.
 * Returns true if all specified required fields have values.
 */
export function validateRequiredFieldsPartial(sWC: ProfileRaw, fieldsToValidate: Set<string>) {
  for (const key of Object.keys(sWC)) {
    if (key === "custom_attributes") continue;
    if (!fieldsToValidate.has(key)) continue;

    const field = sWC[key];
    if (field.required === true && (field.value === "" || field.value === null)) {
      profileState.errors = { [key]: t("errors.required_field", { field: key }) };
      return false;
    }
  }

  for (const key of Object.keys(sWC.custom_attributes ?? {})) {
    const fieldDisplayName = `custom_attributes.${key}`;
    if (!fieldsToValidate.has(fieldDisplayName)) continue;

    const field = sWC.custom_attributes?.[key];
    if (field?.required === true && (field.value === "" || field.value === null)) {
      profileState.errors = { [fieldDisplayName]: t("errors.required_field", { field: fieldDisplayName }) };
      return false;
    }
  }

  return true;
}

/**
 * Builds a payload containing only the fields specified in fieldsToInclude.
 */
export function buildPartialPayload(stateData: ProfileRaw, fieldsToInclude: Set<string>) {
  const regularFields = Object.fromEntries(
    Object.entries(stateData)
      .filter(([k]) => k !== "custom_attributes" && fieldsToInclude.has(k))
      .map(([k, v]: [string, unknown]) => [k, (v as { value: unknown }).value]),
  );

  const customAttributeFields = Object.fromEntries(
    Object.entries(stateData.custom_attributes ?? {})
      .filter(([k]) => fieldsToInclude.has(`custom_attributes.${k}`))
      .map(([k, v]: [string, unknown]) => [k, (v as { value: unknown }).value]),
  );

  // Only include custom_attributes if there are any to include
  if (Object.keys(customAttributeFields).length > 0) {
    return { ...regularFields, custom_attributes: customAttributeFields };
  }

  return regularFields;
}
