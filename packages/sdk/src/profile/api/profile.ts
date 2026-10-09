import type { ApiClientInterface, Payload, ServiceDependencies } from "../../api/base-service";
import { type MeResult, MeService } from "../../api/me-service";
import type { ApiError } from "../../api/shared";
import { type MeUser, MeUserSchema, type MeUserUpdate, type ProfileField, ProfileFieldSchema } from "./schemas";

export type {
  CustomAttributeValue,
  MeUser,
  MeUserUpdate,
  ProfileField,
  ProfileFieldOption,
  ProfileFieldType,
} from "./schemas";
export { CustomAttributeValueSchema, MeUserSchema, ProfileFieldOptionSchema, ProfileFieldSchema, ProfileFieldTypeSchema } from "./schemas";

export type ProfileUpdatePayload = {
  data: MeUserUpdate;
  /** Validates only the fields in `data`, for a form that shows part of the profile. */
  validate_only_sent_fields?: boolean;
};

export type ProfileUpdateArgs = Payload<ProfileUpdatePayload>;

const DATA_FIELD_PREFIX = "payload.data.";

/**
 * Messages of a failed profile update by field (`first_name`, `custom_attributes.tier`), several joined with " | ".
 * Errors that don't name a profile field are left out.
 */
export function profileFieldErrors(error: ApiError): Record<string, string> {
  const messages: Record<string, string[]> = {};

  for (const { field, code, message } of error.details) {
    if (!field?.startsWith(DATA_FIELD_PREFIX)) continue;

    const name = field.slice(DATA_FIELD_PREFIX.length);
    messages[name] = [...(messages[name] ?? []), message || code];
  }

  return Object.fromEntries(Object.entries(messages).map(([name, list]) => [name, list.join(" | ")]));
}

/** The signed-in user's profile on `/api/v2/me`: its values, the form describing them, and updates. */
export class ProfileService extends MeService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "ProfileService", deps);
  }

  /** The signed-in user. */
  async get(): Promise<MeResult<MeUser>> {
    return this.fetchRecord("", MeUserSchema);
  }

  /** The profile form in display order: labels, input types, options, and which fields are required, read-only or locked. */
  async fields(): Promise<MeResult<ProfileField[]>> {
    return this.fetchAll("/profile_fields", ProfileFieldSchema);
  }

  /** Writes profile fields and returns the updated user. */
  async update({ payload }: ProfileUpdateArgs): Promise<MeResult<MeUser>> {
    return this.write("PATCH", "", MeUserSchema, payload);
  }
}
