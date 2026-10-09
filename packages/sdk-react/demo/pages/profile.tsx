import type { MeUser, MeUserUpdate, ProfileField } from "@unidy.io/sdk-react";
import { useProfile, useSession } from "@unidy.io/sdk-react";
import type * as React from "react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type FieldOption = { value: string; label: string };

type ProfileFieldEntry = {
  key: string;
  field: ProfileField;
  label: string;
  value: string;
  type: string;
  required: boolean;
  disabled: boolean;
  options?: FieldOption[];
};

// Inputs hold strings: a yes/no radio's `null` ("not set") option is "".
const toFormValue = (value: unknown): string => (value === null || value === undefined ? "" : String(value));

function extractFields(profile: MeUser, profileFields: ProfileField[]): ProfileFieldEntry[] {
  return profileFields.map((field) => {
    const value = field.custom_attribute ? profile.custom_attributes[field.name] : profile[field.name as keyof MeUser];

    return {
      key: field.custom_attribute ? `custom_attributes.${field.name}` : field.name,
      field,
      label: field.label,
      value: toFormValue(value),
      type: field.type,
      required: field.required,
      // The demo has no multi-select (checkbox) input.
      disabled: field.locked || field.readonly || field.type === "checkbox",
      options: field.options?.map((option) => ({ value: toFormValue(option.value), label: option.label })),
    };
  });
}

/** The value to send: the option's own value (e.g. `true` or `null`), or `null` for a cleared input. */
function toUpdateValue(entry: ProfileFieldEntry, formValue: string) {
  const option = entry.field.options?.find((opt) => toFormValue(opt.value) === formValue);
  if (option) return option.value;
  return formValue === "" ? null : formValue;
}

function ProfileForm({
  profile,
  profileFields,
  fieldErrors,
  isMutating,
  onUpdate,
}: {
  profile: MeUser;
  profileFields: ProfileField[];
  fieldErrors: Record<string, string>;
  isMutating: boolean;
  onUpdate: (data: MeUserUpdate) => Promise<boolean>;
}) {
  const fields = extractFields(profile, profileFields);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of fields) {
      initial[f.key] = f.value;
    }
    return initial;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    const customAttributes: Record<string, unknown> = {};

    for (const f of fields) {
      if (f.disabled) continue;
      const value = toUpdateValue(f, values[f.key] ?? "");

      if (f.field.custom_attribute) {
        customAttributes[f.field.name] = value;
      } else {
        data[f.field.name] = value;
      }
    }

    if (Object.keys(customAttributes).length > 0) data.custom_attributes = customAttributes;
    await onUpdate(data as MeUserUpdate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label htmlFor={`field-${field.key}`} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
            {field.field.locked && <span className="text-gray-400 text-xs ml-2">(locked)</span>}
          </label>
          {field.type === "radio" && Array.isArray(field.options) ? (
            <fieldset
              className="flex w-full overflow-hidden rounded-md border border-gray-300 bg-white"
              aria-invalid={!!fieldErrors[field.key]}
              aria-describedby={fieldErrors[field.key] ? `field-error-${field.key}` : undefined}
            >
              {field.options.map((opt, index, options) => (
                <label
                  key={`${field.key}-${opt.value}`}
                  className={`flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm transition-colors ${
                    (values[field.key] ?? "") === opt.value ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                  } ${field.disabled ? "opacity-60" : ""}`}
                  style={index < options.length - 1 ? { borderRight: "1px solid #d1d5db" } : undefined}
                >
                  <input
                    type="radio"
                    name={`field-${field.key}`}
                    value={opt.value}
                    checked={(values[field.key] ?? "") === opt.value}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    disabled={field.disabled}
                    required={field.required}
                    className="sr-only"
                  />
                  <span className="font-medium">{opt.label}</span>
                </label>
              ))}
            </fieldset>
          ) : field.type === "select" && Array.isArray(field.options) ? (
            <select
              id={`field-${field.key}`}
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              disabled={field.disabled}
              required={field.required}
              className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
              aria-invalid={!!fieldErrors[field.key]}
              aria-describedby={fieldErrors[field.key] ? `field-error-${field.key}` : undefined}
            >
              <option value="" />
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`field-${field.key}`}
              type={field.type === "tel" ? "tel" : field.type === "date" ? "date" : "text"}
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              disabled={field.disabled}
              required={field.required}
              className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
              aria-invalid={!!fieldErrors[field.key]}
              aria-describedby={fieldErrors[field.key] ? `field-error-${field.key}` : undefined}
            />
          )}
          {fieldErrors[field.key] && (
            <p id={`field-error-${field.key}`} role="alert" className="text-red-600 text-sm mt-1">
              {fieldErrors[field.key]}
            </p>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={isMutating}
        className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {isMutating ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}

export function Profile() {
  const session = useSession({ autoRecover: true });
  const profile = useProfile({
    fetchOnMount: session.isAuthenticated,
    callbacks: {
      onSuccess: (msg) => toast.success(msg),
      onError: (err) => toast.error(err),
    },
  });

  return (
    <main className="max-w-md mx-auto p-8">
      <div className="mb-6">
        <Link to="/" className="text-gray-500 text-sm hover:underline">
          &larr; Home
        </Link>
        <h1 className="text-2xl font-bold mt-2">Profile Demo</h1>
      </div>

      {!session.isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700">
            You need to{" "}
            <Link to="/auth" className="underline">
              sign in
            </Link>{" "}
            first to view your profile.
          </p>
        </div>
      )}

      {session.isAuthenticated && profile.isLoading && <p className="text-gray-500">Loading profile...</p>}

      {session.isAuthenticated && profile.error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-700 text-sm">{profile.error}</p>
          <button type="button" onClick={() => profile.refetch()} className="text-red-600 text-sm hover:underline mt-1">
            Retry
          </button>
        </div>
      )}

      {session.isAuthenticated && profile.profile && profile.fields && (
        <ProfileForm
          profile={profile.profile}
          profileFields={profile.fields}
          fieldErrors={profile.fieldErrors}
          isMutating={profile.isMutating}
          onUpdate={profile.updateProfile}
        />
      )}
    </main>
  );
}
