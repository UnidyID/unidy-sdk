import { useNewsletterLogin, useNewsletterPreferenceCenter, useSession } from "@unidy.io/sdk-react";
import type * as React from "react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router";

const NEWSLETTER_INTERNAL_NAME = "main";

const PREFERENCES = [
  { id: "news-updates", label: "News & Updates" },
  { id: "tips-tricks", label: "Tips & Tricks" },
  { id: "success-stories", label: "Success Stories" },
];

function readAndCleanToken(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("preference_token") ?? undefined;
  if (token) {
    params.delete("preference_token");
    params.delete("email");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }
  return token;
}

export function SimplePreferenceCenter() {
  const [initialToken] = useState(readAndCleanToken);
  const { isAuthenticated, email: sessionEmail } = useSession();

  const { subscriptions, preferenceToken, isLoading, error, isMutating, mutationError, subscribe, unsubscribe, updatePreferences } =
    useNewsletterPreferenceCenter({ preferenceToken: initialToken });

  const sub = subscriptions.find((s) => s.newsletter_internal_name === NEWSLETTER_INTERNAL_NAME);
  const isSubscribed = !!sub;
  const mutating = isMutating(NEWSLETTER_INTERNAL_NAME);

  const hasAccess = isAuthenticated || !!initialToken;

  if (!hasAccess) {
    return <LoginView />;
  }

  if (isLoading) {
    return (
      <Shell>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full animate-spin border-2 border-stone-500 border-t-white" />
        </div>
      </Shell>
    );
  }

  if (!isAuthenticated && !preferenceToken) {
    return <LoginView />;
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-white mb-2">Manage your Newsletter</h1>

      {isAuthenticated && <p className="text-sm text-stone-400 mb-4">Logged in as {sessionEmail}</p>}

      {(error || mutationError) && (
        <p className="text-red-400 text-sm mb-4" role="alert">
          {error || mutationError}
        </p>
      )}

      <div className="border border-stone-600 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-white">Main Newsletter</span>
          {isSubscribed ? (
            <button
              type="button"
              onClick={() => unsubscribe(NEWSLETTER_INTERNAL_NAME)}
              disabled={mutating}
              className="text-sm px-3 py-1 text-red-400 border border-red-400/50 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
            >
              Unsubscribe
            </button>
          ) : (
            <button
              type="button"
              onClick={() => subscribe(NEWSLETTER_INTERNAL_NAME)}
              disabled={mutating}
              className="text-sm px-3 py-1 text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-50"
            >
              Subscribe
            </button>
          )}
        </div>

        {isSubscribed && (
          <div className="flex flex-col gap-2 pt-4 border-t border-stone-600">
            <p className="text-sm text-stone-400 mb-1">Preferences</p>
            {PREFERENCES.map((pref) => {
              const checked = sub.preference_identifiers.includes(pref.id);
              return (
                <label key={pref.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={mutating || !sub.confirmed}
                    onChange={() => {
                      const next = checked
                        ? sub.preference_identifiers.filter((p) => p !== pref.id)
                        : [...sub.preference_identifiers, pref.id];
                      updatePreferences(NEWSLETTER_INTERNAL_NAME, next);
                    }}
                    className="w-4 h-4 rounded border-stone-500 text-red-700 focus:ring-red-700 disabled:opacity-50"
                  />
                  <span className="text-sm text-stone-300">{pref.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {sub && !sub.confirmed && <p className="text-amber-400 text-sm mt-4">Please check your email to confirm your subscription.</p>}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-stone-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <Link to="/" className="text-stone-400 hover:text-white text-sm mb-6 inline-block">
          &larr; Back to demos
        </Link>
        <div className="h-1 bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500 rounded-t" />
        <div className="bg-stone-800 border border-stone-600 rounded-b-lg p-8">{children}</div>
      </div>
    </main>
  );
}

function LoginView() {
  const [email, setEmail] = useState("");
  const { isLoading, error, success, sendLoginEmail } = useNewsletterLogin();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendLoginEmail(email, `${window.location.origin}/simple/preference-center`);
  };

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-white mb-4">Manage your Newsletter</h1>
      <p className="text-stone-400 text-sm mb-4">Enter your email to receive a login link.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 px-4 py-2.5 bg-white text-stone-900 placeholder-stone-400 border border-stone-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-r-lg transition disabled:opacity-50"
          >
            {isLoading ? "..." : "\u2192"}
          </button>
        </div>

        {success && <p className="text-green-400 text-sm">Login email sent! Check your inbox.</p>}
        {error && (
          <p className="text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="text-stone-500 text-sm mt-4">
        Not subscribed yet?{" "}
        <Link to="/simple/newsletter" className="text-stone-300 hover:text-white underline">
          Subscribe here
        </Link>
      </p>
    </Shell>
  );
}
