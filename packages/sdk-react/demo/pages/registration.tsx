import { createStandaloneClient, UnidyProvider, useRegistration } from "@unidy.io/sdk-react";
import type * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const DEFAULT_API_URL = import.meta.env.VITE_UNIDY_BASE_URL ?? "http://localhost:3000";
const DEFAULT_API_KEY = import.meta.env.VITE_UNIDY_API_KEY ?? "public-newsletter-api-key";

function buildRegistrationUrl() {
  return `${window.location.origin}/registration`;
}

function encodeToBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function buildPublicKeyCreationOptions(options: {
  challenge: string;
  timeout: number;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: string; alg: number }[];
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    requireResidentKey?: boolean;
    userVerification?: string;
  };
  excludeCredentials?: { type: string; id: string; transports?: string[] }[];
  attestation?: string;
}): PublicKeyCredentialCreationOptions {
  return {
    challenge: decodeBase64Url(options.challenge).buffer as ArrayBuffer,
    timeout: options.timeout || 60_000,
    rp: options.rp,
    user: {
      id: decodeBase64Url(options.user.id).buffer as ArrayBuffer,
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams.map((param) => ({
      type: param.type as PublicKeyCredentialType,
      alg: param.alg,
    })),
    authenticatorSelection: options.authenticatorSelection
      ? {
          authenticatorAttachment: options.authenticatorSelection.authenticatorAttachment as AuthenticatorAttachment | undefined,
          residentKey: options.authenticatorSelection.residentKey as ResidentKeyRequirement | undefined,
          requireResidentKey: options.authenticatorSelection.requireResidentKey,
          userVerification: options.authenticatorSelection.userVerification as UserVerificationRequirement | undefined,
        }
      : undefined,
    excludeCredentials: options.excludeCredentials?.map((credential) => ({
      type: credential.type as PublicKeyCredentialType,
      id: decodeBase64Url(credential.id).buffer as ArrayBuffer,
      transports: credential.transports as AuthenticatorTransport[] | undefined,
    })),
    attestation: (options.attestation as AttestationConveyancePreference) || "none",
  };
}

function formatCreationCredentialForServer(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: encodeToBase64Url(credential.rawId),
    response: {
      attestationObject: encodeToBase64Url(response.attestationObject),
      clientDataJSON: encodeToBase64Url(response.clientDataJSON),
    },
    type: credential.type,
  };
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-0 transition focus:border-blue-500"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </label>
  );
}

interface DemoConfig {
  apiUrl: string;
  apiKey: string;
}

function RegistrationDemo({ config, onApplyConfig }: { config: DemoConfig; onApplyConfig: (config: DemoConfig) => void }) {
  const registration = useRegistration({
    callbacks: {
      onSuccess: (message) => toast.success(message),
      onError: (error) => toast.error(error),
    },
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resumeEmail, setResumeEmail] = useState("");
  const [passkeyName, setPasskeyName] = useState("Demo Passkey");
  const [draftApiUrl, setDraftApiUrl] = useState(config.apiUrl);
  const [draftApiKey, setDraftApiKey] = useState(config.apiKey);
  const didAutoFetchRef = useRef(false);

  const registrationUrl = useMemo(() => buildRegistrationUrl(), []);

  useEffect(() => {
    setDraftApiUrl(config.apiUrl);
    setDraftApiKey(config.apiKey);
  }, [config.apiKey, config.apiUrl]);

  useEffect(() => {
    if (didAutoFetchRef.current) return;
    if (!registration.rid) return;

    didAutoFetchRef.current = true;
    void registration.getRegistration({ rid: registration.rid });
  }, [registration]);

  const createOrUpdatePayload = {
    email: email || undefined,
    password: password || undefined,
    registration_profile_data: {
      first_name: firstName || undefined,
      last_name: lastName || undefined,
    },
  };

  async function handleCreate() {
    await registration.createRegistration({
      registration_url: registrationUrl,
      ...createOrUpdatePayload,
    });
  }

  async function handleUpdate() {
    await registration.updateRegistration(createOrUpdatePayload);
  }

  async function handleRegisterPasskey() {
    if (!window.PublicKeyCredential) {
      toast.error("passkey_not_supported");
      return;
    }

    const options = await registration.getPasskeyCreationOptions();
    if (!options) return;

    try {
      const credential = (await navigator.credentials.create({
        publicKey: buildPublicKeyCreationOptions(options),
      })) as PublicKeyCredential | null;

      if (!credential) {
        toast.error("passkey_cancelled");
        return;
      }

      await registration.registerPasskey({
        publicKeyCredential: formatCreationCredentialForServer(credential),
        passkeyName,
      });
    } catch (error) {
      const message = error instanceof DOMException ? error.name : "passkey_error";
      toast.error(message);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/" className="text-sm text-gray-500 hover:underline">
            &larr; Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Registration Hook Demo</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Exercises the Rails SDK registration API through <code className="rounded bg-gray-100 px-1 py-0.5">useRegistration</code>.
            Create a flow, update it, verify email, add a passkey, and finalize.
          </p>
        </div>

        <div className="space-y-3 sm:pl-48">
          <details className="sm:absolute sm:right-0 sm:top-0 sm:z-20">
            <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm">
              SDK config
            </summary>
            <div className="mt-2 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-lg sm:absolute sm:right-0 sm:top-full sm:w-[26rem] sm:max-w-[calc(100vw-3rem)]">
              <div className="space-y-4">
                <LabeledInput id="config-api-url" label="API URL" value={draftApiUrl} onChange={setDraftApiUrl} />
                <LabeledInput id="config-api-key" label="API Key" value={draftApiKey} onChange={setDraftApiKey} />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onApplyConfig({ apiUrl: draftApiUrl, apiKey: draftApiKey })}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Apply config
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftApiUrl(DEFAULT_API_URL);
                      setDraftApiKey(DEFAULT_API_KEY);
                      onApplyConfig({ apiUrl: DEFAULT_API_URL, apiKey: DEFAULT_API_KEY });
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
                  >
                    Reset defaults
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Current: <span className="font-mono">{config.apiUrl}</span>
                </p>
              </div>
            </div>
          </details>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p>
              RID: <span className="font-mono">{registration.rid ?? "none"}</span>
            </p>
            <p>
              Status: <span className="font-medium">{registration.registration?.expired ? "expired" : "active"}</span>
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  registration.registration?.can_finalize ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                }`}
              >
                {registration.registration?.can_finalize ? "Can finalize" : "Cannot finalize"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {registration.error ? (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">{registration.error}</p>
          {registration.missingFields.length > 0 ? <p className="mt-1">Missing fields: {registration.missingFields.join(", ")}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Section title="1. Registration Data" description="Create a new registration flow or update the current one.">
            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledInput
                id="registration-email"
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                error={registration.fieldErrors.email}
              />
              <LabeledInput
                id="registration-password"
                label="Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                error={registration.fieldErrors.password}
              />
              <LabeledInput id="registration-first-name" label="First name" value={firstName} onChange={setFirstName} />
              <LabeledInput id="registration-last-name" label="Last name" value={lastName} onChange={setLastName} />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreate}
                disabled={registration.isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Create registration
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={registration.isLoading || !registration.rid}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Update registration
              </button>
              <button
                type="button"
                onClick={() => registration.getRegistration()}
                disabled={registration.isLoading || !registration.rid}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Refresh flow
              </button>
            </div>
          </Section>

          <Section
            title="2. Email Verification"
            description="Send and verify the email confirmation code for the current registration flow."
          >
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <LabeledInput
                id="registration-code"
                label="Verification code"
                value={verificationCode}
                onChange={setVerificationCode}
                error={registration.fieldErrors.code}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => registration.sendEmailVerificationCode()}
                  disabled={registration.isLoading || !registration.rid}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Send code
                </button>
                <button
                  type="button"
                  onClick={() => registration.verifyEmail(verificationCode)}
                  disabled={registration.isLoading || !registration.rid || verificationCode.length === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            </div>

            {registration.enableResendAfter ? (
              <p className="mt-3 text-sm text-gray-500">Resend available after: {registration.enableResendAfter}</p>
            ) : null}
          </Section>

          <Section
            title="3. Passkey"
            description="Request WebAuthn creation options, then create and attach a passkey to this registration flow."
          >
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <LabeledInput id="registration-passkey-name" label="Passkey name" value={passkeyName} onChange={setPasskeyName} />
              <button
                type="button"
                onClick={handleRegisterPasskey}
                disabled={registration.isLoading || !registration.rid}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Register passkey
              </button>
              <button
                type="button"
                onClick={() => registration.removePasskey()}
                disabled={registration.isLoading || !registration.registration?.has_passkey}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Remove passkey
              </button>
            </div>
          </Section>

          <Section title="4. Finalize Or Cancel" description="Complete the registration or discard the current flow.">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => registration.finalizeRegistration()}
                disabled={registration.isLoading || !registration.rid}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Finalize registration
              </button>
              <button
                type="button"
                onClick={() => registration.cancelRegistration()}
                disabled={registration.isLoading || !registration.rid}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                Cancel registration
              </button>
              <button
                type="button"
                onClick={() => registration.reset()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
              >
                Reset local state
              </button>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Resume Link" description="Send a resume email for an active registration flow by email address.">
            <div className="space-y-4">
              <LabeledInput id="resume-email" label="Resume email" type="email" value={resumeEmail} onChange={setResumeEmail} />
              <button
                type="button"
                onClick={() => registration.sendResumeLink(resumeEmail)}
                disabled={registration.isLoading || resumeEmail.length === 0}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Send resume link
              </button>
            </div>
          </Section>

          <Section title="Live Flow State" description="Current response payload returned by the registration endpoints.">
            <div className="rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(registration.registration, null, 2) || "null"}
              </pre>
            </div>
          </Section>

          <Section title="Quick Notes" description="A few details that help while testing this flow.">
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Use the page URL as the registration redirect target so resume links come back here.</li>
              <li>The hook auto-recovers a `registration_rid` query param from the URL on load.</li>
              <li>Finalize can fail with `cannot_finalize`; the demo surfaces backend `missing_fields` when present.</li>
              <li>Passkey registration requires a browser and origin that support WebAuthn.</li>
            </ul>
          </Section>
        </div>
      </div>
    </main>
  );
}

export function Registration() {
  const [config, setConfig] = useState<DemoConfig>({
    apiUrl: DEFAULT_API_URL,
    apiKey: DEFAULT_API_KEY,
  });

  const client = useMemo(
    () =>
      createStandaloneClient({
        baseUrl: config.apiUrl,
        apiKey: config.apiKey,
      }),
    [config.apiKey, config.apiUrl],
  );

  return (
    <UnidyProvider client={client}>
      <RegistrationDemo config={config} onApplyConfig={setConfig} />
    </UnidyProvider>
  );
}
