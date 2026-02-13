import * as React from "react";
import { Link } from "react-router";

export function Home() {
  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">@unidy.io/sdk-react Demo</h1>
      <nav>
        <ul className="space-y-3">
          <li>
            <Link to="/newsletter" className="text-blue-600 hover:underline text-lg">
              Newsletter Subscribe
            </Link>
            <p className="text-gray-600 text-sm">useNewsletterSubscribe hook demo</p>
          </li>
          <li>
            <Link to="/preference-center" className="text-blue-600 hover:underline text-lg">
              Preference Center
            </Link>
            <p className="text-gray-600 text-sm">useNewsletterPreferenceCenter hook demo</p>
          </li>
          <li>
            <Link to="/newsletter-react-query" className="text-blue-600 hover:underline text-lg">
              Newsletter (React Query)
            </Link>
            <p className="text-gray-600 text-sm">Direct service usage with @tanstack/react-query</p>
          </li>
          <li>
            <Link to="/auth" className="text-blue-600 hover:underline text-lg">
              Authentication
            </Link>
            <p className="text-gray-600 text-sm">useAuth hook demo (email, password, magic code, social login)</p>
          </li>
          <li>
            <Link to="/profile" className="text-blue-600 hover:underline text-lg">
              Profile
            </Link>
            <p className="text-gray-600 text-sm">useProfile hook demo (fetch and update user profile)</p>
          </li>
          <li>
            <Link to="/ticketables" className="text-blue-600 hover:underline text-lg">
              Ticketables
            </Link>
            <p className="text-gray-600 text-sm">useTicketables and usePagination demo</p>
          </li>
        </ul>
      </nav>
    </main>
  );
}
