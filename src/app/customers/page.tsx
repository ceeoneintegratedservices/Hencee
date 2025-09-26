"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";
import CreateCustomerModal from "@/components/CreateCustomerModal";
import { listCustomers, createCustomer } from "@/services/customers";
import type { CustomerRecord, CreateCustomerBody } from "@/types/customers";
import { API_ENDPOINTS } from "@/config/api";
import { authFetch } from "@/services/authFetch";

// Helper function to build query string
function buildQuery(params: { page?: number; limit?: number; search?: string } = {}): string {
  const qp = new URLSearchParams();
  if (params.page != null) qp.set("page", String(params.page));
  if (params.limit != null) qp.set("limit", String(params.limit));
  if (params.search) qp.set("search", params.search);
  const qs = qp.toString();
  return qs ? `?${qs}` : "";
}

interface Customer extends CustomerRecord {
  orders: number;
  orderTotal: number;
}

export default function CustomersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState("This Week");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerRecord[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        // Make the API call with pagination parameters
        const response = await authFetch(`${API_ENDPOINTS.customers}${buildQuery({ page, limit, search: searchQuery || undefined })}`);
        const fullResponse = await response.json();
        
        if (aborted) return;
        
        // Extract data and pagination info
        const { data: customersList, total: totalCustomers } = fullResponse;
        
        if (!Array.isArray(customersList)) {
          throw new Error("Invalid response format");
        }
        
        // Store all customers for summary calculations
        setAllCustomers(customersList);
        
        // Map customers to the format needed for the UI
        const mapped: Customer[] = customersList.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email || "",
          phone: c.phone || "",
          orders: c.sales ? c.sales.length : (c.orders ?? 0),
          orderTotal: (c.sales && c.sales.length) ? c.sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0) : (c.orderTotal ?? 0),
          customerSince: c.createdAt ? new Date(c.createdAt).toLocaleString() : (c.customerSince || ""),
          status: (c.status as any) || "Active",
          address: c.address,
        }));
        
        setCustomers(mapped);
        setTotal(totalCustomers);
      } catch (e: any) {
        console.error("Error loading customers:", e);
        setError(e?.message || "Failed to load customers");
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    run();
    return () => { aborted = true; };
  }, [page, limit, searchQuery]);

  // Derived summary metrics from allCustomers
  const now = new Date();
  function withinTimeframe(dateStr?: string) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    if (timeframe === "This Week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo && d <= now;
    }
    if (timeframe === "This Month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (timeframe === "This Year") {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  }

  const summaryAll = total;
  
  // Make sure allCustomers is an array before using filter
  const customersArray = Array.isArray(allCustomers) ? allCustomers : [];
  
  const summaryActive = customersArray.filter(c => (c.sales?.length || 0) > 0).length;
  const summaryInactive = Math.max(0, total - summaryActive);
  const summaryNew = customersArray.filter(c => withinTimeframe(c.createdAt)).length;
  const summaryPurchasing = customersArray.filter(c => (c.sales || []).some(s => String(s.status).toUpperCase() === "PENDING")).length;
  const summaryAbandoned = customersArray.filter(c => (c.sales || []).some(s => {
    const isPending = String(s.status).toUpperCase() === "PENDING";
    const olderThan7 = s.createdAt ? (now.getTime() - new Date(s.createdAt).getTime()) > (7 * 24 * 60 * 60 * 1000) : false;
    return isPending && olderThan7;
  })).length;

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for customers:`, selectedCustomers);
  };

  const handleCreateCustomer = async (customerData: CreateCustomerBody) => {
    try {
      await createCustomer(customerData);
      setIsCreateModalOpen(false);
      
      // Refresh list after creating a new customer
      const response = await authFetch(`${API_ENDPOINTS.customers}${buildQuery({ page, limit, search: searchQuery || undefined })}`);
      const fullResponse = await response.json();
      
      // Extract data and pagination info
      const { data: customersList, total: totalCustomers } = fullResponse;
      
      if (!Array.isArray(customersList)) {
        throw new Error("Invalid response format");
      }
      
      // Store all customers for summary calculations
      setAllCustomers(customersList);
      
      // Map customers to the format needed for the UI
      const mapped: Customer[] = customersList.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email || "",
        phone: c.phone || "",
        orders: c.sales ? c.sales.length : (c.orders ?? 0),
        orderTotal: (c.sales && c.sales.length) ? c.sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0) : (c.orderTotal ?? 0),
        customerSince: c.createdAt ? new Date(c.createdAt).toLocaleString() : (c.customerSince || ""),
        status: (c.status as any) || "Active",
        address: c.address,
      }));
      
      setCustomers(mapped);
      setTotal(totalCustomers);
    } catch (e) {
      console.error("Error creating customer:", e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="customers" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Customers" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto px-5 pt-7">
          {/* Breadcrumbs */}
          <Breadcrumb items={[
            { label: "Home", href: "/dashboard" },
            { label: "Customers", href: "/customers" }
          ]} />

          {/* Customers Summary */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Customers Summary</h2>
              <div className="flex items-center gap-2">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="This Year">This Year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* All Customers */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-green-600 font-medium">+15.80%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{loading ? '—' : summaryAll.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">All Customers</p>
              </div>

              {/* Active */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-green-600 font-medium">+85%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{loading ? '—' : summaryActive.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Active</p>
              </div>

              {/* In-Active */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-red-600 font-medium">-10%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{loading ? '—' : summaryInactive.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">In-Active</p>
              </div>

              {/* New Customers */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-xs text-red-600 font-medium">-20%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{loading ? '—' : summaryNew.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">New Customers</p>
              </div>

              {/* Purchasing */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{loading ? '—' : summaryPurchasing.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Purchasing</p>
              </div>

              {/* Abandoned Carts */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{loading ? '—' : summaryAbandoned.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Abandoned Carts</p>
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add a New Customer
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                </button>
                
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Filter
                </button>
                
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Share
                </button>
                
                <div className="relative">
                  <select
                    onChange={(e) => handleBulkAction(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors appearance-none pr-8"
                  >
                    <option value="">Bulk Action</option>
                    <option value="export">Export</option>
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                    <option value="delete">Delete</option>
                  </select>
                  <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {error && (
                <div className="p-6 text-red-700 bg-red-50 border-b border-red-200">{error}</div>
              )}
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === customers.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Since
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!loading && customers.length === 0 && !error && (
                    <tr>
                      <td className="px-6 py-10 text-center text-gray-500" colSpan={8}>No customers found</td>
                    </tr>
                  )}
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{customer.email}</span>
                          <button
                            onClick={() => customer.email && copyToClipboard(customer.email)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            disabled={!customer.email}
                          >
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{customer.phone}</span>
                          <button
                            onClick={() => customer.phone && copyToClipboard(customer.phone)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            disabled={!customer.phone}
                          >
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₦{customer.orderTotal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.customerSince}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <select className="px-2 py-1 border border-gray-300 rounded text-sm" value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-700">Items per page</span>
                  </div>
                  <span className="text-sm text-gray-700">{(total === 0 ? 0 : (page - 1) * limit + 1)}-{Math.min(page * limit, total)} of {total} items</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <select className="px-2 py-1 border border-gray-300 rounded text-sm" value={page} onChange={(e) => setPage(Number(e.target.value))}>
                    {Array.from({ length: Math.max(1, Math.ceil(total / limit)) }).map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700">of {Math.max(1, Math.ceil(total / limit))} pages</span>
                  <div className="flex gap-1">
                    <button className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors" onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / limit)), p + 1))} disabled={page >= Math.max(1, Math.ceil(total / limit))}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCustomer}
      />
    </div>
  );
}
