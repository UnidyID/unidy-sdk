import { getUnidyClient } from "../api";
import { t } from "../i18n";
import type { MeUser, MeUserUpdate, ProfileField } from "./api/schemas";
import { type ProfileNode, type ProfileRaw, type ProfileValue, state as profileState } from "./store/profile-store";

const CUSTOM_ATTRIBUTES_PREFIX = "custom_attributes.";

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

function isEmpty(value: ProfileValue | undefined): boolean {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

/** How a radio or select compares an option's value with the field's: as a string, with `null` as "". */
export function optionKey(value: ProfileValue | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

/** The node of a field name such as `first_name` or `custom_attributes.tier`. */
export function getProfileNode(data: ProfileRaw, fieldName: string): ProfileNode | undefined {
  if (fieldName.startsWith(CUSTOM_ATTRIBUTES_PREFIX)) {
    return data.custom_attributes?.[fieldName.slice(CUSTOM_ATTRIBUTES_PREFIX.length)];
  }

  return fieldName === "custom_attributes" ? undefined : data[fieldName];
}

/** Every node with its field name, custom attributes as `custom_attributes.<name>`. */
function profileEntries(data: ProfileRaw): [string, ProfileNode][] {
  return [
    ...Object.entries(data).filter(([name]) => name !== "custom_attributes"),
    ...Object.entries(data.custom_attributes ?? {}).map(([name, node]): [string, ProfileNode] => [
      `${CUSTOM_ATTRIBUTES_PREFIX}${name}`,
      node,
    ]),
  ];
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

/** A cleared input is `null`, and a number input's text a number. */
function toUpdateValue({ type, value }: ProfileNode): ProfileValue | undefined {
  if (value === "") return null;
  if (type === "number" && typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return value;
}

/**
 * The values of the fields the user may change, as `PATCH /api/v2/me` takes them.
 * If fieldsToInclude is provided, only those fields are included.
 */
export function buildUpdateData(stateData: ProfileRaw, fieldsToInclude?: Set<string>): MeUserUpdate {
  const data: Record<string, unknown> = {};
  const customAttributes: Record<string, unknown> = {};

  for (const [fieldName, node] of profileEntries(stateData)) {
    if (node?.readonly || (fieldsToInclude && !fieldsToInclude.has(fieldName))) continue;

    if (fieldName.startsWith(CUSTOM_ATTRIBUTES_PREFIX)) {
      customAttributes[fieldName.slice(CUSTOM_ATTRIBUTES_PREFIX.length)] = toUpdateValue(node);
    } else {
      data[fieldName] = toUpdateValue(node);
    }
  }

  if (Object.keys(customAttributes).length > 0) {
    data.custom_attributes = customAttributes;
  }

  return data as MeUserUpdate;
}

export function hasProfileChanged(): boolean {
  const currentData = buildUpdateData(profileState.data);
  const savedData = buildUpdateData(profileState.configuration);
  const sortKeys = (_: string, val: unknown) =>
    val !== null && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : val;
  return JSON.stringify(currentData, sortKeys) !== JSON.stringify(savedData, sortKeys);
}

/**
 * The profile form's fields in display order, each with the user's value. A user attribute missing from
 * the user is left out, so it is never shown empty and saved as cleared.
 */
export function buildProfileNodes(user: MeUser, fields: ProfileField[]): ProfileRaw {
  const nodes: Record<string, ProfileNode> = {};
  const customAttributes: Record<string, ProfileNode> = {};

  for (const field of fields) {
    const node = (value: ProfileValue): ProfileNode => ({
      value,
      type: field.type,
      label: field.label,
      required: field.required,
      readonly: field.readonly,
      locked: field.locked,
      locked_text: field.locked_text,
      options: field.options ?? undefined,
      attr_name: field.name,
    });

    if (field.custom_attribute) {
      customAttributes[field.name] = node(user.custom_attributes[field.name] ?? null);
    } else if (field.name in user) {
      nodes[field.name] = node(user[field.name as keyof MeUser] as ProfileValue);
    }
  }

  return { ...nodes, custom_attributes: customAttributes } as ProfileRaw;
}

/** The nodes with the values an update saved. */
export function withSavedValues(data: ProfileRaw, user: MeUser): ProfileRaw {
  const nodes: Record<string, ProfileNode> = {};
  for (const [name, node] of Object.entries(data)) {
    if (name === "custom_attributes") continue;
    nodes[name] = name in user ? { ...node, value: user[name as keyof MeUser] as ProfileValue } : node;
  }

  const customAttributes: Record<string, ProfileNode> = {};
  for (const [name, node] of Object.entries(data.custom_attributes ?? {})) {
    customAttributes[name] = name in user.custom_attributes ? { ...node, value: user.custom_attributes[name] } : node;
  }

  return { ...nodes, custom_attributes: customAttributes } as ProfileRaw;
}

/** Whether an update filled an empty field: a brand's lock applies to a field once it holds a value. */
export function filledEmptyField(before: ProfileRaw, after: ProfileRaw): boolean {
  return profileEntries(before).some(([fieldName, node]) => isEmpty(node?.value) && !isEmpty(getProfileNode(after, fieldName)?.value));
}

/** Fetches the user and the profile form in parallel, and merges them into the store's nodes. */
export async function fetchProfileNodes(): Promise<[string, null] | [null, ProfileRaw]> {
  const { profile } = getUnidyClient();
  const [[userError, user], [fieldsError, fields]] = await Promise.all([profile.get(), profile.fields()]);

  if (userError || fieldsError) {
    return [userError ?? fieldsError, null];
  }

  return [null, buildProfileNodes(user as MeUser, fields as ProfileField[])];
}
