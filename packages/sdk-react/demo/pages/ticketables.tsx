import type { Subscription, Ticket } from "@unidy.io/sdk/standalone";
import { type ExportFormat, usePagination, useSession, useTicketables } from "@unidy.io/sdk-react";
import * as React from "react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type TicketableType = "ticket" | "subscription";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleDateString();
}

function formatPrice(price: number, currency: string | null): string {
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price);
    } catch {
      // fall through
    }
  }
  return price.toFixed(2);
}

function ExportButton({
  id,
  format,
  label,
  onExport,
}: {
  id: string;
  format: ExportFormat;
  label: string;
  onExport: (id: string, format: ExportFormat) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onExport(id, format);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={loading} className="text-blue-600 hover:underline text-sm disabled:opacity-50">
      {loading ? "..." : label}
    </button>
  );
}

function TicketablesTable({
  items,
  type,
  onExport,
}: {
  items: (Ticket | Subscription)[];
  type: TicketableType;
  onExport: (id: string, format: ExportFormat) => Promise<void>;
}) {
  if (items.length === 0) {
    return <p className="text-gray-500 py-4">No {type}s found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="py-2 pr-4 font-medium text-gray-700" scope="col">
              Title
            </th>
            <th className="py-2 pr-4 font-medium text-gray-700" scope="col">
              State
            </th>
            <th className="py-2 pr-4 font-medium text-gray-700" scope="col">
              Starts
            </th>
            <th className="py-2 pr-4 font-medium text-gray-700 text-right" scope="col">
              Price
            </th>
            <th className="py-2 font-medium text-gray-700" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2 pr-4">{item.title}</td>
              <td className="py-2 pr-4">
                <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100">{item.state}</span>
              </td>
              <td className="py-2 pr-4">{formatDate(item.starts_at)}</td>
              <td className="py-2 pr-4 text-right">{formatPrice(item.price, item.currency)}</td>
              <td className="py-2 space-x-2">
                <ExportButton id={item.id} format="pdf" label="PDF" onExport={onExport} />
                {item.exportable_to_wallet && <ExportButton id={item.id} format="pkpass" label="Wallet" onExport={onExport} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onNext,
  onPrev,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNext: () => void;
  onPrev: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-4 py-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrevPage}
        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        aria-label="Previous page"
      >
        Prev
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNextPage}
        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}

export function Ticketables() {
  const session = useSession({ autoRecover: true });
  const [type, setType] = useState<TicketableType>("ticket");
  const [stateFilter, setStateFilter] = useState<string>("");

  const pagination = usePagination({ perPage: 10 });

  const ticketables = useTicketables({
    type,
    pagination,
    filter: stateFilter ? { state: stateFilter } : undefined,
    fetchOnMount: session.isAuthenticated,
    callbacks: {
      onSuccess: (msg) => toast.success(msg),
      onError: (err) => toast.error(err),
    },
  });

  const handleExport = async (id: string, format: ExportFormat) => {
    const link = await ticketables.getExportLink(id, format);
    if (link) {
      window.open(link.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleTypeChange = (newType: TicketableType) => {
    setType(newType);
    pagination.goToPage(1);
  };

  const handleStateFilterChange = (value: string) => {
    setStateFilter(value);
    pagination.goToPage(1);
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <Link to="/" className="text-gray-500 text-sm hover:underline">
          &larr; Home
        </Link>
        <h1 className="text-2xl font-bold mt-2">Ticketables Demo</h1>
      </div>

      {!session.isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700">
            You need to{" "}
            <Link to="/auth" className="underline">
              sign in
            </Link>{" "}
            first to view your tickets and subscriptions.
          </p>
        </div>
      )}

      {session.isAuthenticated && (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <fieldset className="flex gap-2">
              <legend className="sr-only">Type</legend>
              <button
                type="button"
                onClick={() => handleTypeChange("ticket")}
                className={`px-3 py-1 rounded text-sm border ${
                  type === "ticket" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
                }`}
                aria-pressed={type === "ticket"}
              >
                Tickets
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("subscription")}
                className={`px-3 py-1 rounded text-sm border ${
                  type === "subscription" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
                }`}
                aria-pressed={type === "subscription"}
              >
                Subscriptions
              </button>
            </fieldset>

            <div>
              <label htmlFor="state-filter" className="sr-only">
                Filter by state
              </label>
              <select
                id="state-filter"
                value={stateFilter}
                onChange={(e) => handleStateFilterChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="">All states</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="redeemed">Redeemed</option>
              </select>
            </div>
          </div>

          {ticketables.isLoading && <p className="text-gray-500">Loading {type}s...</p>}

          {ticketables.error && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-700 text-sm">{ticketables.error}</p>
              <button type="button" onClick={() => ticketables.refetch()} className="text-red-600 text-sm hover:underline mt-1">
                Retry
              </button>
            </div>
          )}

          {!ticketables.isLoading && !ticketables.error && (
            <>
              <TicketablesTable items={ticketables.items} type={type} onExport={handleExport} />
              <PaginationBar
                page={pagination.page}
                totalPages={pagination.totalPages}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                onNext={pagination.nextPage}
                onPrev={pagination.prevPage}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}
