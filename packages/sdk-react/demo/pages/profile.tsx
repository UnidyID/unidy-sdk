import type { UserProfileData } from "@unidy.io/sdk-react";
import { useAuth, useProfile } from "@unidy.io/sdk-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type ProfileFieldEntry = {
  key: string;
  label: string;
  value: string | null | undefined;
  type: string;
  required: boolean;
  locked: boolean;
  options?: Array<{ value: string; label: string }>;
  radioOptions?: Array<{ value: string; label: string; checked: boolean }>;
};

function extractFields(profile: UserProfileData): ProfileFieldEntry[] {
  const fields: ProfileFieldEntry[] = [];
  const skipKeys = new Set(["custom_attributes"]);

  for (const [key, field] of Object.entries(profile)) {
    if (skipKeys.has(key) || !field || typeof field !== "object") continue;
    if (!("label" in field)) continue;

    fields.push({
      key,
      label: field.label ?? key,
      value: typeof field.value === "string" ? field.value : field.value != null ? String(field.value) : null,
      type: field.type ?? "text",
      required: field.required ?? false,
      locked: field.locked ?? false,
      options: "options" in field && Array.isArray(field.options) ? field.options : undefined,
      radioOptions:
        "radio_options" in field && Array.isArray(field.radio_options)
          ? field.radio_options.map((option) => ({
              value: option.value != null ? String(option.value) : "",
              label: option.label,
              checked: option.checked,
            }))
          : undefined,
    });
  }

  // Custom attributes
  if (profile.custom_attributes) {
    for (const [key, field] of Object.entries(profile.custom_attributes)) {
      fields.push({
        key: `custom_attributes.${key}`,
        label: field.label ?? key,
        value: typeof field.value === "string" ? field.value : field.value != null ? String(field.value) : null,
        type: field.type ?? "text",
        required: field.required ?? false,
        locked: field.locked ?? false,
        options: "options" in field && Array.isArray(field.options) ? field.options : undefined,
        radioOptions:
          "radio_options" in field && Array.isArray(field.radio_options)
            ? field.radio_options.map((option) => ({
                value: option.value != null ? String(option.value) : "",
                label: option.label,
                checked: option.checked,
              }))
            : undefined,
      });
    }
  }

  return fields;
}

function ProfileForm({
  profile,
  fieldErrors,
  isMutating,
  onUpdate,
}: {
  profile: UserProfileData;
  fieldErrors: Record<string, string>;
  isMutating: boolean;
  onUpdate: (data: Record<string, unknown>) => Promise<boolean>;
}) {
  const fields = extractFields(profile);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of fields) {
      initial[f.key] = f.value ?? "";
    }
    return initial;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};

    for (const f of fields) {
      if (f.locked) continue;
      const rawValue = values[f.key];
      let valueToSend = rawValue;

      // Match Stencil's country_code semantics: submit ISO country code values.
      // If we somehow receive a display label, convert it back to the option value.
      if (f.key === "country_code" && Array.isArray(f.options)) {
        const matchByLabel = f.options.find((opt) => opt.label === rawValue);
        if (matchByLabel) {
          valueToSend = matchByLabel.value;
        }
      }

      if (f.key.startsWith("custom_attributes.")) {
        const attrKey = f.key.replace("custom_attributes.", "");
        if (!payload.custom_attributes) payload.custom_attributes = {};
        (payload.custom_attributes as Record<string, unknown>)[attrKey] = valueToSend;
      } else {
        payload[f.key] = valueToSend;
      }
    }

    await onUpdate(payload);
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
            {field.locked && <span className="text-gray-400 text-xs ml-2">(locked)</span>}
          </label>
          {field.type === "radio" && Array.isArray(field.radioOptions) ? (
            <fieldset
              className="flex w-full overflow-hidden rounded-md border border-gray-300 bg-white"
              aria-invalid={!!fieldErrors[field.key]}
              aria-describedby={fieldErrors[field.key] ? `field-error-${field.key}` : undefined}
            >
              {field.radioOptions.map((opt, index) => (
                <label
                  key={`${field.key}-${opt.value}`}
                  className={`flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm transition-colors ${
                    (values[field.key] ?? "") === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } ${field.locked ? "opacity-60" : ""}`}
                  style={index < field.radioOptions.length - 1 ? { borderRight: "1px solid #d1d5db" } : undefined}
                >
                  <input
                    type="radio"
                    name={`field-${field.key}`}
                    value={opt.value}
                    checked={(values[field.key] ?? "") === opt.value}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    disabled={field.locked}
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
              disabled={field.locked}
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
              disabled={field.locked}
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
  const auth = useAuth({ autoRecover: true });
  const profile = useProfile({
    fetchOnMount: auth.isAuthenticated,
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

      {!auth.isAuthenticated && (
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

      {auth.isAuthenticated && profile.isLoading && <p className="text-gray-500">Loading profile...</p>}

      {auth.isAuthenticated && profile.error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-700 text-sm">{profile.error}</p>
          <button type="button" onClick={() => profile.refetch()} className="text-red-600 text-sm hover:underline mt-1">
            Retry
          </button>
        </div>
      )}

      {auth.isAuthenticated && profile.profile && (
        <ProfileForm
          profile={profile.profile}
          fieldErrors={profile.fieldErrors}
          isMutating={profile.isMutating}
          onUpdate={profile.updateProfile}
        />
      )}
    </main>
  );
}
