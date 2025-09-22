"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchSalesDashboard } from "../../../services/sales";
import type { SalesDashboardResponse, SalesDashboardQuery, SalesOrderItem } from "../../../types/sales";
import { formatCurrencyNGN, statusColorClass } from "../../../utils/format";
import Link from "next/link";

type SortState = { key: keyof SalesOrderItem | "orderDate"; dir: "asc" | "desc" };

export default function SalesDashboardPage() {
  const [query, setQuery] = useState<SalesDashboardQuery>({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "orderDate", dir: "desc" });

  const [data, setData] = useState<SalesDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derivedQuery = useMemo(() => ({
    page: query.page,
    limit: query.limit,
    search: search || undefined,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy: typeof sort.key === "string" ? String(sort.key) : undefined,
    sortDir: sort.dir,
  }), [query.page, query.limit, search, status, dateFrom, dateTo, sort.key, sort.dir]);

  useEffect(() => {
    let aborted = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchSalesDashboard(derivedQuery);
        if (!aborted) setData(res);
      } catch (e: any) {
        if (!aborted) setError(e?.message || "Failed to load sales dashboard");
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    run();
    return () => { aborted = true; };
  }, [derivedQuery.page, derivedQuery.limit, derivedQuery.search, derivedQuery.status, derivedQuery.dateFrom, derivedQuery.dateTo, derivedQuery.sortBy, derivedQuery.sortDir]);

  function onSort(key: SortState["key"]) {
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
  }

  function onPageChange(nextPage: number) {
    setQuery((q) => ({ ...q, page: nextPage }));
  }

  function onLimitChange(nextLimit: number) {
    setQuery({ page: 1, limit: nextLimit });
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / (data.limit || 10))) : 1;

  return (
    <main className="min-h-screen bg-[#f7f7f8] px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Sales Dashboard</h1>
          <Link href="/" className="text-blue-700 hover:underline">Back to Home</Link>
        </header>

        {/* Filters Bar */}
        <section className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
            <input
              aria-label="Search orders"
              placeholder="Search by customer, tracking id..."
              className="border rounded px-3 py-2 w-full md:max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter by status"
              className="border rounded px-3 py-2 w-full md:w-auto"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option>Pending</option>
              <option>Completed</option>
              <option>Canceled</option>
              <option>Returned</option>
              <option>Damaged</option>
              <option>Abandoned</option>
            </select>
            <input
              aria-label="From date"
              type="date"
              className="border rounded px-3 py-2"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              aria-label="To date"
              type="date"
              className="border rounded px-3 py-2"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <div className="flex-1" />
            <select
              aria-label="Rows per page"
              className="border rounded px-3 py-2 w-full md:w-auto"
              value={query.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </section>

        {/* Summary */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {loading && !data ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl shadow p-4 animate-pulse" />
            ))
          ) : error ? (
            <div className="col-span-8 bg-red-50 text-red-700 border border-red-200 rounded p-4">{error}</div>
          ) : data ? (
            <>
              {([
                ["All Orders", data.summary.allOrders],
                ["Pending", data.summary.pending],
                ["Completed", data.summary.completed],
                ["Canceled", data.summary.canceled],
                ["Returned", data.summary.returned],
                ["Damaged", data.summary.damaged],
                ["Abandoned Cart", data.summary.abandonedCart],
                ["Customers", data.summary.customers],
              ] as const).map(([label, value]) => (
                <div key={label} className="bg-white rounded-xl shadow p-4">
                  <div className="text-sm text-[#6E7079]">{label}</div>
                  <div className="text-2xl font-bold">{value}</div>
                </div>
              ))}
            </>
          ) : null}
        </section>

        {/* Bulk actions */}
        <section className="bg-white rounded-xl shadow p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input type="checkbox" aria-label="Select all" />
            <span className="text-sm text-[#6E7079]">Select all</span>
          </div>
          <div className="flex items-center gap-2">
            <select aria-label="Bulk actions" className="border rounded px-3 py-2">
              <option>Bulk actions</option>
              <option>Mark as Completed</option>
              <option>Mark as Pending</option>
              <option>Cancel</option>
            </select>
            <button className="px-4 py-2 rounded bg-[#02016a] text-white text-sm font-semibold">Apply</button>
          </div>
        </section>

        {/* Table */}
        <section className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-[#6E7079] text-sm">
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => onSort("orderDate")}>
                  Order Date
                </th>
                <th className="px-4 py-3">Order Type</th>
                <th className="px-4 py-3">Tracking ID</th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => onSort("orderTotal")}>Order Total</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-20" /></td>
                  </tr>
                ))
              )}
              {!loading && data?.orders?.length ? (
                data.orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{o.customerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{o.orderDate}</td>
                    <td className="px-4 py-3">{o.orderType}</td>
                    <td className="px-4 py-3">{o.trackingId}</td>
                    <td className="px-4 py-3">{formatCurrencyNGN(o.orderTotal)}</td>
                    <td className="px-4 py-3">{o.action}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-semibold ${statusColorClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : !loading && !error ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#6E7079]" colSpan={7}>No orders found</td>
                </tr>
              ) : null}
              {error && !loading && (
                <tr>
                  <td className="px-4 py-6 text-center text-red-700" colSpan={7}>{error}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Pagination */}
        <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
          <div className="text-sm text-[#6E7079]">
            Page {data?.page ?? query.page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded border bg-white disabled:opacity-50"
              onClick={() => onPageChange(Math.max(1, (data?.page ?? 1) - 1))}
              disabled={(data?.page ?? 1) <= 1 || loading}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const current = data?.page ?? 1;
              const start = Math.max(1, Math.min(current - 2, totalPages - 4));
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  className={`px-3 py-2 rounded border ${pageNum === current ? "bg-[#02016a] text-white" : "bg-white"}`}
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="px-3 py-2 rounded border bg-white disabled:opacity-50"
              onClick={() => onPageChange(Math.min(totalPages, (data?.page ?? 1) + 1))}
              disabled={(data?.page ?? 1) >= totalPages || loading}
            >
              Next
            </button>
          </div>
        </nav>
      </div>
    </main>
  );
}


