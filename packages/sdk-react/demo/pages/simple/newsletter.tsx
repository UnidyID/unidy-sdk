import { useNewsletterSubscribe, useSession } from "@unidy.io/sdk-react";
import * as React from "react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router";

const NEWSLETTER_INTERNAL_NAME = "main";

export function SimpleNewsletter() {
  const { isAuthenticated, email: sessionEmail, logout } = useSession();
  const { isLoading, error, subscribe } = useNewsletterSubscribe();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const effectiveEmail = isAuthenticated ? sessionEmail : email;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await subscribe({
      email: effectiveEmail,
      newsletters: [{ internalName: NEWSLETTER_INTERNAL_NAME }],
      redirectToAfterConfirmation: `${window.location.origin}/simple/preference-center`,
    });
    if (result.success) setSuccess(true);
  };

  return (
    <main className="min-h-screen bg-stone-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <Link to="/" className="text-stone-400 hover:text-white text-sm mb-6 inline-block">
          &larr; Back to demos
        </Link>

        <div className="h-1 bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500 rounded-t" />

        <div className="bg-stone-800 border border-stone-600 rounded-b-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Subscribe to our Newsletter</h1>

          {success ? (
            <p className="text-green-400">You're subscribed! Please check your email to confirm.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="simple-email" className="text-sm text-stone-300">
                  Email address *
                </label>
                <div className="flex">
                  <input
                    id="simple-email"
                    type="email"
                    required
                    value={effectiveEmail}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={isAuthenticated}
                    placeholder="Enter your email address"
                    className={`flex-1 px-4 py-2.5 bg-white text-stone-900 placeholder-stone-400 border border-stone-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-stone-500 ${isAuthenticated ? "bg-stone-200 text-stone-500 cursor-not-allowed" : ""}`}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !effectiveEmail}
                    className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-r-lg transition disabled:opacity-50"
                    aria-label="Subscribe"
                  >
                    {isLoading ? "..." : "\u2192"}
                  </button>
                </div>
              </div>

              {isAuthenticated && (
                <p className="text-sm text-amber-400">
                  If you want to subscribe with a different email address, please{" "}
                  <button type="button" onClick={logout} className="underline hover:text-amber-300">
                    logout
                  </button>
                  !
                </p>
              )}

              {error && (
                <p className="text-red-400 text-sm" role="alert">
                  {error}
                </p>
              )}

              <p className="text-xs text-stone-400 leading-relaxed">
                *By subscribing, you agree that we may use your email address to send you our newsletter. You can unsubscribe at any time.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
