"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Breadcrumb from "@/components/Breadcrumb";
import { NotificationContainer, useNotifications } from "@/components/Notification";
import {
  getOutsourcedReport,
  type OutsourcedReportResponse,
  type OutsourcedReportSummary,
  type OutsourcedSupplierRow,
  type OutsourcedPaymentStatusEntry,
  type OutsourcedTimelinePoint,
} from "@/services/reports";

const DATE_RANGE_OPTIONS = [
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_quarter", label: "Last Quarter" },
  { value: "year_to_date", label: "Year to Date" },
  { value: "all_time", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "₦0";
  return `₦${Number(value).toLocaleString()}`;
};

const formatPercent = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "0%";
  return `${Number(value).toFixed(1)}%`;
};

export default function OutsourcedReportsPage() {
  const { showError, notifications, removeNotification } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [report, setReport] = useState<OutsourcedReportResponse | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    dateRange: "this_month",
    startDate: "",
    endDate: "",
    supplier: "",
  });
  const [pendingFilters, setPendingFilters] = useState(activeFilters);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
    } else {
      window.location.href = "/login";
    }
  }, []);

  const fetchReport = async (filters = activeFilters) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setApiError(null);
    try {
      const payload: any = {
        dateRange: filters.dateRange,
      };
      if (filters.dateRange === "custom" && filters.startDate && filters.endDate) {
        payload.startDate = filters.startDate;
        payload.endDate = filters.endDate;
      }
      if (filters.supplier) {
        payload.outsourcedSupplier = filters.supplier;
      }
      const data = await getOutsourcedReport(payload);
      setReport(data);
    } catch (error: any) {
      console.error("Failed to fetch outsourced report", error);
      const message = error?.message || "Unable to load outsourced report";
      setApiError(message);
      setReport(null);
      showError("Error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReport();
    }
  }, [isAuthenticated]);

  const summary: OutsourcedReportSummary = report?.summary || {};
  const suppliers: OutsourcedSupplierRow[] = report?.suppliers || [];
  const paymentStatus: OutsourcedPaymentStatusEntry[] = report?.paymentStatus || [];
  const timeline: OutsourcedTimelinePoint[] = report?.timeline || [];

  const topSuppliers = suppliers.slice(0, 8);
  const paymentTotal = paymentStatus.reduce(
    (sum, entry) => sum + (entry.amount ?? 0),
    0
  );
  const timelineMax = timeline.reduce(
    (max, point) => Math.max(max, point.revenue ?? 0, point.margin ?? 0),
    0
  );

  const handleApplyFilters = () => {
    setActiveFilters(pendingFilters);
    fetchReport(pendingFilters);
  };

  const handleResetFilters = () => {
    const defaults = {
      dateRange: "this_month",
      startDate: "",
      endDate: "",
      supplier: "",
    };
    setPendingFilters(defaults);
    setActiveFilters(defaults);
    fetchReport(defaults);
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Outsourced Orders",
        value: summary.totalOrders ?? 0,
        hint: "Orders fulfilled via suppliers",
      },
      {
        label: "Revenue",
        value: formatCurrency(summary.totalRevenue),
        hint: "Gross revenue generated",
      },
      {
        label: "Total Cost",
        value: formatCurrency(summary.totalCost),
        hint: "Fulfillment & supplier cost",
      },
      {
        label: "Total Margin",
        value: formatCurrency(summary.totalMargin),
        hint: `Avg margin ${formatPercent(summary.averageMargin)}`,
      },
      {
        label: "Outstanding Balance",
        value: formatCurrency(summary.outstandingBalance),
        hint: "Amount still owed",
      },
    ],
    [summary]
  );

  if (!isAuthenticated) return null;

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      <Sidebar currentPage="reports" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        <Header title="Outsourced Supplier Analytics" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="p-4 sm:p-6">
          <Breadcrumb
            items={[
              { label: "Reports", href: "/reports" },
              { label: "Outsourced Suppliers" },
            ]}
          />

          <section className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="w-full sm:w-48">
                <label className="text-xs font-semibold text-gray-500">Date Range</label>
                <select
                  value={pendingFilters.dateRange}
                  onChange={(e) =>
                    setPendingFilters((prev) => ({ ...prev, dateRange: e.target.value }))
                  }
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {pendingFilters.dateRange === "custom" && (
                <>
                  <div className="w-full sm:w-40">
                    <label className="text-xs font-semibold text-gray-500">Start Date</label>
                    <input
                      type="date"
                      value={pendingFilters.startDate}
                      onChange={(e) =>
                        setPendingFilters((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <label className="text-xs font-semibold text-gray-500">End Date</label>
                    <input
                      type="date"
                      value={pendingFilters.endDate}
                      onChange={(e) =>
                        setPendingFilters((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-semibold text-gray-500">Supplier</label>
                <input
                  type="text"
                  placeholder="Search supplier name"
                  value={pendingFilters.supplier}
                  onChange={(e) =>
                    setPendingFilters((prev) => ({ ...prev, supplier: e.target.value }))
                  }
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 rounded-lg bg-[#02016a] text-white text-sm font-medium hover:bg-[#03024a]"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500 shadow-sm">
              Loading outsourced analytics…
            </div>
          ) : apiError ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-sm text-red-700 shadow-sm">
              {apiError}
            </div>
          ) : !report ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm">
              No outsourced data available for the selected filters.
            </div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
                {summaryCards.map((card) => (
                  <div
                    key={card.label}
                    className="bg-white border border-gray-100 rounded-xl shadow-sm p-4"
                  >
                    <p className="text-xs uppercase text-gray-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.hint}</p>
                  </div>
                ))}
              </section>

              <section className="grid gap-4 lg:grid-cols-3 mb-6">
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Payment Status</h3>
                    <span className="text-xs text-gray-400">
                      {paymentStatus.length} statuses
                    </span>
                  </div>
                  {paymentStatus.length === 0 ? (
                    <p className="text-sm text-gray-500">No payment data.</p>
                  ) : (
                    <div className="space-y-3">
                      {paymentStatus.map((entry) => {
                        const amount = entry.amount ?? 0;
                        const percent = paymentTotal
                          ? Math.round((amount / paymentTotal) * 100)
                          : 0;
                        return (
                          <div key={entry.status}>
                            <div className="flex items-center justify-between text-sm font-medium text-gray-900 capitalize">
                              <span>{entry.status.replace(/_/g, " ")}</span>
                              <span>{formatCurrency(amount)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <span>{percent}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Revenue vs Margin</h3>
                    <span className="text-xs text-gray-400">
                      {timeline.length} periods
                    </span>
                  </div>
                  {timeline.length === 0 ? (
                    <p className="text-sm text-gray-500">No timeline data.</p>
                  ) : (
                    <div className="space-y-3">
                      {timeline.map((point) => {
                        const revenuePercent = timelineMax
                          ? Math.round(((point.revenue ?? 0) / timelineMax) * 100)
                          : 0;
                        const marginPercent = timelineMax
                          ? Math.round(((point.margin ?? 0) / timelineMax) * 100)
                          : 0;
                        return (
                          <div key={point.period}>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{point.period}</span>
                              <span>{formatCurrency(point.revenue)}</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                              <div
                                className="absolute inset-y-0 left-0 bg-blue-200"
                                style={{ width: `${revenuePercent}%` }}
                              ></div>
                              <div
                                className="absolute inset-y-0 left-0 bg-blue-600"
                                style={{ width: `${marginPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Suppliers</h3>
                    <p className="text-sm text-gray-500">
                      Orders, revenue, and margin by supplier (top {topSuppliers.length})
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    Total suppliers: {suppliers.length}
                  </span>
                </div>
                {topSuppliers.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No supplier data.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Supplier
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Orders
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Cost
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Margin
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Outstanding
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {topSuppliers.map((supplier) => (
                          <tr key={supplier.supplierId || supplier.supplierName}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">
                                {supplier.supplierName || "Supplier"}
                              </div>
                              {supplier.marginPercent !== undefined && (
                                <div className="text-xs text-gray-500">
                                  Margin {formatPercent(supplier.marginPercent)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {supplier.orders ?? 0}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(supplier.revenue)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(supplier.cost)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(supplier.margin)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(supplier.outstandingBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}


