import { useNewsletterLogin, useNewsletterPreferenceCenter, useNewsletterResendConfirmation } from "@unidy.io/sdk-react";
import { type FormEvent, useCallback, useState } from "react";
import { Link } from "react-router";
import { NEWSLETTERS } from "../newsletter-config";

function NoTokenView() {
  const [email, setEmail] = useState("");
  const { isLoading: sendingLogin, error: loginError, success: loginSent, sendLoginEmail } = useNewsletterLogin();

  const handleSendLogin = (e: FormEvent) => {
    e.preventDefault();
    if (email) {
      sendLoginEmail(email, `${window.location.origin}/preference-center`);
    }
  };

  return (
    <main className="flex-1 p-8 flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-2xl flex flex-col gap-6 border border-gray-200">
        <Link to="/" className="text-indigo-600 hover:underline text-sm">
          &larr; Back to demos
        </Link>

        <div className="flex flex-col items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-indigo-700">Preference Center</h1>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-gray-600 text-center">Enter your email to receive a login link and manage your subscriptions.</p>

          <form onSubmit={handleSendLogin} className="flex flex-col gap-1">
            <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="flex gap-2">
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-4 py-2 border border-gray-300 rounded-lg flex-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={sendingLogin}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition border border-indigo-600 disabled:opacity-50 whitespace-nowrap"
              >
                {sendingLogin ? "Sending..." : "Send login link"}
              </button>
            </div>
          </form>

          {loginSent && (
            <output className="text-green-600 text-sm block text-center">
              Login email sent! Check your inbox for a link to manage your subscriptions.
            </output>
          )}
          {loginError && (
            <p className="text-red-500 text-sm text-center" role="alert">
              {loginError}
            </p>
          )}

          <p className="text-gray-500 text-sm text-center">
            Not subscribed yet?{" "}
            <Link to="/newsletter" className="text-indigo-600 hover:underline font-medium">
              Subscribe to our newsletters
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function readAndCleanToken(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("preference_token") ?? undefined;
  if (token) {
    params.delete("preference_token");
    params.delete("email");
    const query = params.toString();
    const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(null, "", cleanUrl);
  }
  return token;
}

export function PreferenceCenter() {
  const [initialToken] = useState(readAndCleanToken);

  const { subscriptions, preferenceToken, isLoading, error, isMutating, mutationError, subscribe, unsubscribe, updatePreferences } =
    useNewsletterPreferenceCenter({ preferenceToken: initialToken });

  const { isLoading: resending, resendConfirmation } = useNewsletterResendConfirmation({ preferenceToken });

  const subscribedNames = new Set(subscriptions.map((s) => s.newsletter_internal_name));

  const handleTogglePreference = useCallback(
    (internalName: string, currentPrefs: string[], prefId: string) => {
      const newPrefs = currentPrefs.includes(prefId) ? currentPrefs.filter((p) => p !== prefId) : [...currentPrefs, prefId];
      updatePreferences(internalName, newPrefs);
    },
    [updatePreferences],
  );

  if (!initialToken) {
    return <NoTokenView />;
  }

  if (isLoading) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-2xl flex flex-col gap-6 border border-gray-200">
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full animate-spin border-2 border-gray-300 border-t-gray-800" />
          </div>
        </div>
      </main>
    );
  }

  if (!preferenceToken) {
    return <NoTokenView />;
  }

  return (
    <main className="flex-1 p-8 flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-2xl flex flex-col gap-6 border border-gray-200">
        <Link to="/" className="text-indigo-600 hover:underline text-sm">
          &larr; Back to demos
        </Link>

        <div className="flex flex-col items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-indigo-700">Your Subscriptions</h1>
        </div>

        {/* Token info bar */}
        <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
          <span className="text-gray-600 text-sm flex-1">Logged in via preference token</span>
          <Link to="/newsletter" className="text-indigo-600 hover:underline text-sm font-medium">
            Back to subscribe
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded" role="alert">
            {error}
          </div>
        )}
        {mutationError && (
          <div className="bg-red-50 text-red-700 p-3 rounded" role="alert">
            {mutationError}
          </div>
        )}

        {/* Newsletter cards */}
        <div className="flex flex-col gap-4">
          <p className="text-gray-700 text-sm font-medium">Manage subscriptions</p>

          {NEWSLETTERS.map((nl) => {
            const sub = subscriptions.find((s) => s.newsletter_internal_name === nl.internalName);
            const isSubscribed = subscribedNames.has(nl.internalName);
            const mutating = isMutating(nl.internalName);

            return (
              <div key={nl.internalName} className="border border-gray-200 rounded-xl p-4">
                {/* Header: name + toggle */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{nl.label}</span>
                  {isSubscribed ? (
                    <button
                      type="button"
                      onClick={() => unsubscribe(nl.internalName)}
                      disabled={mutating}
                      className="text-sm font-medium rounded-lg px-3 py-1 text-red-500 hover:text-red-700 border border-red-300 hover:bg-red-50 disabled:opacity-50"
                    >
                      Unsubscribe
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => subscribe(nl.internalName)}
                      disabled={mutating}
                      className="text-sm font-medium rounded-lg px-3 py-1 text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 disabled:opacity-50"
                    >
                      Subscribe
                    </button>
                  )}
                </div>

                {/* DOI warning */}
                {sub && !sub.confirmed && (
                  <div className="mt-3 bg-amber-100 text-amber-800 text-sm rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                    <span>Please confirm that you want to receive this newsletter. We have sent you an email.</span>
                    <button
                      type="button"
                      onClick={() => resendConfirmation(nl.internalName)}
                      disabled={resending}
                      className="text-sm text-amber-700 hover:text-amber-900 font-medium border border-amber-400 rounded-lg px-3 py-1 hover:bg-amber-200 whitespace-nowrap disabled:opacity-50"
                    >
                      {resending ? "Sending..." : "Resend"}
                    </button>
                  </div>
                )}

                {/* Preferences */}
                {isSubscribed && nl.preferences.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-medium mb-3">Preferences</p>
                    <div className="flex flex-col gap-2">
                      {nl.preferences.map((pref) => {
                        const isChecked = sub?.preference_identifiers.includes(pref.id) ?? false;
                        return (
                          <label key={pref.id} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePreference(nl.internalName, sub?.preference_identifiers ?? [], pref.id)}
                              disabled={mutating || !sub?.confirmed}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-gray-700">{pref.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
