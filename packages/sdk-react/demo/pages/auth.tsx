import { useLogin, useSession } from "@unidy.io/sdk-react";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

function EmailStep({ onSubmit, error, isLoading }: { onSubmit: (email: string) => void; error: string | null; isLoading: boolean }) {
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email);
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
          required
        />
        {error && (
          <p id="email-error" role="alert" className="text-red-600 text-sm mt-1">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Loading..." : "Continue"}
      </button>
    </form>
  );
}

function VerificationStep({
  loginOptions,
  onPassword,
  onMagicCode,
  onPasskey,
  onSocial,
  onBack,
  passkeyError,
  isLoading,
}: {
  loginOptions: { magic_link: boolean; password: boolean; social_logins: string[]; passkey: boolean } | null;
  onPassword: () => void;
  onMagicCode: () => void;
  onPasskey: () => void;
  onSocial: (provider: string) => void;
  onBack: () => void;
  passkeyError: string | null;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">Choose how to sign in:</p>

      {loginOptions?.passkey && (
        <div>
          <button
            type="button"
            onClick={onPasskey}
            disabled={isLoading}
            className="w-full border border-gray-300 rounded-md py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Sign in with passkey"}
          </button>
          {passkeyError && (
            <p role="alert" className="text-red-600 text-sm mt-1">
              {passkeyError}
            </p>
          )}
        </div>
      )}

      {loginOptions?.password && (
        <button type="button" onClick={onPassword} className="w-full border border-gray-300 rounded-md py-2 hover:bg-gray-50">
          Sign in with password
        </button>
      )}

      {loginOptions?.magic_link && (
        <button type="button" onClick={onMagicCode} className="w-full border border-gray-300 rounded-md py-2 hover:bg-gray-50">
          Send magic code
        </button>
      )}

      {loginOptions?.social_logins?.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => onSocial(provider)}
          className="w-full border border-gray-300 rounded-md py-2 hover:bg-gray-50 capitalize"
        >
          Continue with {provider}
        </button>
      ))}

      <button type="button" onClick={onBack} className="text-gray-500 text-sm hover:underline">
        Back
      </button>
    </div>
  );
}

function PasswordStep({
  onSubmit,
  error,
  isLoading,
  onBack,
  onForgot,
}: {
  onSubmit: (password: string) => void;
  error: string | null;
  isLoading: boolean;
  onBack: () => void;
  onForgot: () => void;
}) {
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password);
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          aria-invalid={!!error}
          aria-describedby={error ? "password-error" : undefined}
          required
        />
        {error && (
          <p id="password-error" role="alert" className="text-red-600 text-sm mt-1">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-gray-500 text-sm hover:underline">
          Back
        </button>
        <button type="button" onClick={onForgot} className="text-blue-600 text-sm hover:underline">
          Forgot password?
        </button>
      </div>
    </form>
  );
}

function MagicCodeStep({
  onSubmit,
  onResend,
  error,
  isLoading,
  resendAfter,
  onBack,
}: {
  onSubmit: (code: string) => void;
  onResend: () => void;
  error: string | null;
  isLoading: boolean;
  resendAfter: number | null;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [remainingMs, setRemainingMs] = useState(0);

  const initialRemainingMs = useMemo(() => {
    if (!resendAfter) return 0;
    // Support both "duration in ms" and absolute "timestamp in ms" shapes.
    return resendAfter > 1_000_000_000_000 ? Math.max(0, resendAfter - Date.now()) : Math.max(0, resendAfter);
  }, [resendAfter]);

  useEffect(() => {
    setRemainingMs(initialRemainingMs);
  }, [initialRemainingMs]);

  useEffect(() => {
    if (remainingMs <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingMs]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(code);
      }}
      className="space-y-4"
    >
      <p className="text-gray-600 text-sm">Enter the 4-digit code sent to your email.</p>
      <div>
        <label htmlFor="magic-code" className="block text-sm font-medium text-gray-700 mb-1">
          Code
        </label>
        <input
          id="magic-code"
          type="text"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-center text-2xl tracking-widest"
          aria-invalid={!!error}
          aria-describedby={error ? "magic-code-error" : undefined}
          required
        />
        {error && (
          <p id="magic-code-error" role="alert" className="text-red-600 text-sm mt-1">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Verifying..." : "Verify"}
      </button>
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-gray-500 text-sm hover:underline">
          Back
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={remainingSeconds > 0}
          className="text-blue-600 text-sm hover:underline disabled:opacity-50"
        >
          {remainingSeconds > 0 ? `Resend in ${remainingSeconds}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordStep({
  resetPasswordStep,
  onSend,
  onBack,
  error,
  isLoading,
}: {
  resetPasswordStep: "idle" | "sent";
  onSend: () => void;
  onBack: () => void;
  error: string | null;
  isLoading: boolean;
}) {
  if (resetPasswordStep === "sent") {
    return (
      <div className="space-y-4">
        <p className="text-green-600">Password reset email sent. Check your inbox.</p>
        <button type="button" onClick={onBack} className="text-gray-500 text-sm hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">We'll send you an email to reset your password.</p>
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onSend}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Sending..." : "Send reset email"}
      </button>
      <button type="button" onClick={onBack} className="text-gray-500 text-sm hover:underline">
        Back
      </button>
    </div>
  );
}

function ConnectBrandStep({
  onConnect,
  onCancel,
  isLoading,
  error,
}: {
  onConnect: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800 font-medium">Connect your account</p>
        <p className="text-yellow-700 text-sm mt-1">
          An account with this email already exists on the platform. Would you like to connect it to your current sign-in?
        </p>
      </div>
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onConnect}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Connecting..." : "Connect Account"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="w-full border border-gray-300 rounded-md py-2 hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  );
}

function MissingFieldsStep({
  fields,
  onSubmit,
  isLoading,
  error,
  onCancel,
}: {
  fields: Record<string, unknown> | null;
  onSubmit: (values: Record<string, unknown>) => void;
  isLoading: boolean;
  error: string | null;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const fieldNames = fields ? Object.keys(fields) : [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-4"
    >
      <p className="text-gray-600 text-sm">Please fill in the required fields to complete sign-in.</p>
      {fieldNames.map((name) => (
        <div key={name}>
          <label htmlFor={`field-${name}`} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
            {name.replace(/_/g, " ")}
          </label>
          <input
            id={`field-${name}`}
            type="text"
            value={values[name] ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
      ))}
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Submitting..." : "Submit"}
      </button>
      <button type="button" onClick={onCancel} className="text-gray-500 text-sm hover:underline">
        Cancel
      </button>
    </form>
  );
}

function AuthenticatedView({ email, onLogout }: { email: string; onLogout: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <p className="text-green-800 font-medium">Authenticated</p>
        <p className="text-green-700 text-sm">{email}</p>
      </div>
      <button type="button" onClick={onLogout} className="w-full border border-red-300 text-red-600 rounded-md py-2 hover:bg-red-50">
        Logout
      </button>
      <Link to="/profile" className="block text-center text-blue-600 hover:underline">
        Go to Profile
      </Link>
    </div>
  );
}

export function Auth() {
  const login = useLogin({
    callbacks: {
      onSuccess: (msg) => toast.success(msg),
      onError: (err) => toast.error(err),
    },
  });
  const session = useSession();

  return (
    <main className="max-w-md mx-auto p-8">
      <div className="mb-6">
        <Link to="/" className="text-gray-500 text-sm hover:underline">
          &larr; Home
        </Link>
        <h1 className="text-2xl font-bold mt-2">Authentication</h1>
        <p className="text-gray-500 text-sm">
          Step: <code className="bg-gray-100 px-1 rounded">{login.step}</code>
        </p>
      </div>

      {login.errors.global && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-700 text-sm">{login.errors.global}</p>
        </div>
      )}

      {!session.isAuthenticated && login.step === "email" && (
        <EmailStep onSubmit={(email) => login.submitEmail(email)} error={login.errors.email} isLoading={login.isLoading} />
      )}

      {!session.isAuthenticated && login.step === "verification" && (
        <VerificationStep
          loginOptions={login.loginOptions}
          onPassword={() => login.goToStep("password")}
          onMagicCode={() => login.sendMagicCode()}
          onPasskey={() => login.authenticateWithPasskey()}
          onSocial={(provider) => {
            window.location.href = login.getSocialAuthUrl(provider, window.location.href);
          }}
          onBack={() => login.goBack()}
          passkeyError={login.errors.passkey}
          isLoading={login.isLoading}
        />
      )}

      {!session.isAuthenticated && login.step === "password" && (
        <PasswordStep
          onSubmit={(password) => login.submitPassword(password)}
          error={login.errors.password}
          isLoading={login.isLoading}
          onBack={() => login.goBack()}
          onForgot={() => login.goToStep("reset-password")}
        />
      )}

      {!session.isAuthenticated && login.step === "magic-code" && (
        <MagicCodeStep
          onSubmit={(code) => login.submitMagicCode(code)}
          onResend={() => login.sendMagicCode()}
          error={login.errors.magicCode}
          isLoading={login.isLoading}
          resendAfter={login.magicCodeResendAfter}
          onBack={() => login.goBack()}
        />
      )}

      {!session.isAuthenticated && login.step === "reset-password" && (
        <ResetPasswordStep
          resetPasswordStep={login.resetPasswordStep}
          onSend={() => login.sendResetPasswordEmail()}
          onBack={() => login.goBack()}
          error={login.errors.resetPassword}
          isLoading={login.isLoading}
        />
      )}

      {!session.isAuthenticated && login.step === "connect-brand" && (
        <ConnectBrandStep
          onConnect={() => login.connectBrand()}
          onCancel={() => login.cancelBrandConnect()}
          isLoading={login.isLoading}
          error={login.errors.global}
        />
      )}

      {!session.isAuthenticated && login.step === "missing-fields" && (
        <MissingFieldsStep
          fields={login.missingFieldDefinitions}
          onSubmit={(values) => login.submitMissingFields(values)}
          isLoading={login.isLoading}
          error={login.errors.missingFields}
          onCancel={() => login.cancelBrandConnect()}
        />
      )}

      {session.isAuthenticated && <AuthenticatedView email={session.email} onLogout={() => session.logout()} />}
    </main>
  );
}
