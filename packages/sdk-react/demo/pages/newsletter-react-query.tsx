import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { isSuccess, useUnidyClient } from "@unidy.io/sdk-react";
import { Link } from "react-router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function NewsletterList() {
  const client = useUnidyClient();

  const {
    data: newsletters,
    isLoading: loadingNewsletters,
    isError: newslettersError,
    error: newslettersErrorDetails,
  } = useQuery({
    queryKey: ["newsletters"],
    queryFn: async () => {
      const result = await client.newsletters.listAll();
      if (isSuccess(result)) return result[1].newsletters;
      throw new Error(result[0] ?? "Failed to fetch newsletters");
    },
  });

  const {
    data: subscriptions,
    isLoading: loadingSubscriptions,
    isError: subscriptionsError,
    error: subscriptionsErrorDetails,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const result = await client.newsletters.list();
      if (isSuccess(result)) return result[1];
      throw new Error(result[0] ?? "Failed to fetch subscriptions");
    },
  });

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold mb-3">Available Newsletters</h2>
        {loadingNewsletters ? (
          <p className="text-gray-500">Loading available newsletters...</p>
        ) : newslettersError ? (
          <p className="text-red-600 text-sm">Failed to load available newsletters: {newslettersErrorDetails.message}</p>
        ) : newsletters && newsletters.length > 0 ? (
          <ul className="space-y-2">
            {newsletters.map((nl) => (
              <li key={nl.id} className="border rounded p-3">
                <div className="font-medium">{nl.title}</div>
                <div className="text-sm text-gray-500">{nl.internal_name}</div>
                {nl.description && <div className="text-sm text-gray-600 mt-1">{nl.description}</div>}
                {nl.preference_groups.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">Preference groups: {nl.preference_groups.map((g) => g.name).join(", ")}</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No newsletters available.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Current Subscriptions</h2>
        {loadingSubscriptions ? (
          <p className="text-gray-500">Loading current subscriptions...</p>
        ) : subscriptionsError ? (
          <p className="text-red-600 text-sm">Failed to load current subscriptions: {subscriptionsErrorDetails.message}</p>
        ) : subscriptions && subscriptions.length > 0 ? (
          <ul className="space-y-2">
            {subscriptions.map((sub) => (
              <li key={sub.id} className="border rounded p-3">
                <div className="font-medium">{sub.newsletter_internal_name}</div>
                <div className="text-sm text-gray-500">
                  {sub.confirmed_at ? "Confirmed" : "Pending"} &middot; {sub.email}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No subscriptions.</p>
        )}
      </section>
    </div>
  );
}

export function NewsletterReactQuery() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="max-w-lg mx-auto p-8">
        <Link to="/" className="text-blue-600 hover:underline text-sm">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">Newsletter (React Query)</h1>
        <p className="text-gray-600 text-sm mb-4">
          This demo uses <code>useUnidyClient()</code> + <code>@tanstack/react-query</code> directly, bypassing our convenience hooks.
        </p>
        <NewsletterList />
      </main>
    </QueryClientProvider>
  );
}
