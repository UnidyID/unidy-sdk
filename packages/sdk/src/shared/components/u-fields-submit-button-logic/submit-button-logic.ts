import { type ProfileRaw, state as profileState } from "../../../profile/store/profile-store";

export function validateRequiredFieldsUnchanged(sWC: ProfileRaw) {
  for (const key of Object.keys(sWC)) {
    if (key === "custom_attributes") continue;
    const field = sWC[key];
    if (field.required === true || field.profile_query === true && (field.value === "" || field.value === null || field.value === undefined)) {
      profileState.errors = { [key]: "This field is required." };
      return false;
    }
  }

  for (const key of Object.keys(sWC.custom_attributes ?? {})) {
    const field = sWC.custom_attributes?.[key];
    const fieldDisplayName = `custom_attributes.${key}`;
    if (field?.required === true || field?.profile_query === true && (field.value === "" || field.value === null || field.value === undefined)) {
      profileState.errors = { [fieldDisplayName]: "This field is required." };
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
