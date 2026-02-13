import { useNewsletterLogin, useNewsletterSubscribe } from "@unidy.io/sdk-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { type DemoNewsletter, NEWSLETTERS } from "../newsletter-config";

function getDefaultPreferences(nl: DemoNewsletter): Set<string> {
  return new Set(nl.preferences.filter((p) => p.defaultChecked).map((p) => p.id));
}

function getInitialSelection(): Record<string, Set<string>> {
  const initial: Record<string, Set<string>> = {};
  for (const nl of NEWSLETTERS) {
    if (nl.defaultChecked) {
      initial[nl.internalName] = getDefaultPreferences(nl);
    }
  }
  return initial;
}

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  // Newsletter selection state: { [internalName]: Set<preferenceIdentifier> }
  const [selectedNewsletters, setSelectedNewsletters] = useState<Record<string, Set<string>>>(getInitialSelection);

  const toggleNewsletter = (internalName: string) => {
    setSelectedNewsletters((prev) => {
      const next = { ...prev };
      if (next[internalName]) {
        delete next[internalName];
      } else {
        const nl = NEWSLETTERS.find((n) => n.internalName === internalName);
        next[internalName] = nl ? getDefaultPreferences(nl) : new Set();
      }
      return next;
    });
  };

  const togglePreference = (internalName: string, prefId: string) => {
    setSelectedNewsletters((prev) => {
      const current = prev[internalName];
      if (!current) return prev;
      const next = new Set(current);
      if (next.has(prefId)) {
        next.delete(prefId);
      } else {
        next.add(prefId);
      }
      return { ...prev, [internalName]: next };
    });
  };

  // Subscribe hook
  const { isLoading: subscribing, error: subscribeError, fieldErrors, subscribe, reset: resetSubscribe } = useNewsletterSubscribe();

  // Login hook
  const { isLoading: sendingLogin, error: loginError, success: loginSent, sendLoginEmail } = useNewsletterLogin();

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setConsentError("Please accept the terms to continue.");
      return;
    }
    setConsentError(null);

    const selected = Object.entries(selectedNewsletters).filter(([, prefs]) => prefs !== undefined);
    if (selected.length === 0) return;

    const result = await subscribe({
      email,
      newsletters: selected.map(([name, prefs]) => ({
        internalName: name,
        preferenceIdentifiers: [...prefs],
      })),
      additionalFields: {
        first_name: firstName || null,
        last_name: lastName || null,
        phone_number: phoneNumber || null,
      },
    });

    if (result.success) {
      setSubscribeSuccess(true);
    }
  };

  const handleLoginEmail = () => {
    if (email) {
      sendLoginEmail(email, `${window.location.origin}/preference-center`);
    }
  };

  const handleReset = () => {
    setSubscribeSuccess(false);
    resetSubscribe();
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setConsent(false);
    setConsentError(null);
    setSelectedNewsletters(getInitialSelection());
  };

  return (
    <main className="flex-1 p-8 flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-2xl flex flex-col gap-6 border border-gray-200">
        <Link to="/" className="text-indigo-600 hover:underline text-sm">
          &larr; Back to demos
        </Link>

        <div className="flex flex-col items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-indigo-700">Subscribe to our Newsletter</h1>
        </div>

        {subscribeSuccess ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
                aria-hidden="true"
              >
                <title>Success</title>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">You're subscribed!</h2>
            <p className="text-gray-600 text-center">
              Please check your email to confirm your subscription. Once confirmed, you can manage your preferences on the{" "}
              <Link to="/preference-center" className="text-indigo-600 hover:underline font-medium">
                preference center
              </Link>
              .
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
            >
              Subscribe another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="subscribe-email" className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="subscribe-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-red-500 text-sm" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Already subscribed? Send login email */}
            <div className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600">Already subscribed?</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLoginEmail}
                  disabled={sendingLogin || !email}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors disabled:opacity-50 disabled:no-underline"
                >
                  {sendingLogin ? "Sending..." : "Send me a login link to manage my subscriptions"}
                </button>
              </div>
              {loginSent && (
                <output className="text-green-600 text-sm block">
                  Login email sent! Check your inbox for a link to the preference center.
                </output>
              )}
              {loginError && (
                <p className="text-red-500 text-sm" role="alert">
                  {loginError}
                </p>
              )}
            </div>

            {/* Newsletter selection */}
            <div className="flex flex-col gap-3">
              <p className="text-gray-700 text-sm font-medium">Select newsletters</p>

              {NEWSLETTERS.map((nl) => (
                <div key={nl.internalName} className="flex flex-col gap-1 border border-gray-200 rounded-lg p-3">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                    <span>{nl.label}</span>
                    <input
                      type="checkbox"
                      checked={!!selectedNewsletters[nl.internalName]}
                      onChange={() => toggleNewsletter(nl.internalName)}
                      className="appearance-none relative w-11 h-6 bg-gray-300 rounded-full cursor-pointer transition-colors checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow after:transition-transform checked:after:translate-x-5"
                    />
                  </label>

                  {/* Preferences */}
                  {selectedNewsletters[nl.internalName] && nl.preferences.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 ml-2">
                      {nl.preferences.map((pref) => (
                        <label key={pref.id} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedNewsletters[nl.internalName]?.has(pref.id) ?? false}
                            onChange={() => togglePreference(nl.internalName, pref.id)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{pref.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {fieldErrors[nl.internalName] && (
                    <p className="text-red-500 text-sm mt-1" role="alert">
                      {fieldErrors[nl.internalName]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Additional fields */}
            <div className="flex flex-col gap-3">
              <p className="text-gray-700 text-sm font-medium">Additional fields</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {fieldErrors.first_name && (
                    <p className="text-red-500 text-sm" role="alert">
                      {fieldErrors.first_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {fieldErrors.last_name && (
                    <p className="text-red-500 text-sm" role="alert">
                      {fieldErrors.last_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone number (optional)"
                  className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {fieldErrors.phone_number && (
                  <p className="text-red-500 text-sm" role="alert">
                    {fieldErrors.phone_number}
                  </p>
                )}
              </div>
            </div>

            {/* Consent */}
            <div className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked) setConsentError(null);
                  }}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  I want to receive the newsletter with information about entertainment offers and specials via email. My consent can at any
                  time be revoked.
                </span>
              </label>
              {consentError && (
                <p className="text-red-500 text-sm" role="alert">
                  {consentError}
                </p>
              )}
            </div>

            {/* Submit */}
            {subscribeError && (
              <div className="bg-red-50 text-red-700 p-3 rounded" role="alert">
                {subscribeError}
              </div>
            )}

            <button
              type="submit"
              disabled={subscribing || !consent}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow transition border border-indigo-600 disabled:opacity-50"
            >
              {subscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
