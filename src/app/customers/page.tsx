"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";
import CreateCustomerModal from "@/components/CreateCustomerModal";
import { 
  listCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getTopCustomers, 
  getOutstandingBalanceCustomers,
  type TopCustomer,
  type OutstandingBalanceCustomer
} from "@/services/customers";
import { getDashboardCustomers, type DashboardCustomers } from "@/services/dashboard";
import { NotificationContainer, useNotifications } from "@/components/Notification";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  orders?: number;
  orderTotal?: number;
  customerSince?: string;
  status?: string;
  address?: string;
  creditLimit?: number;
  balance?: number;
}

export default function CustomersPage() {
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState("This Week");

  // API state management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Summary state management
  const [showSummary, setShowSummary] = useState(false);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [outstandingCustomers, setOutstandingCustomers] = useState<OutstandingBalanceCustomer[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<DashboardCustomers | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listCustomers({ limit: 100 });
      // Handle both array response and { data: [] } response formats
      const customersArray = Array.isArray(response) ? response : ((response as any).data || []);
      setCustomers(customersArray);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to load customers');
      showError('Error', err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary data
  const fetchSummaryData = async () => {
    setSummaryLoading(true);
    try {
      const [topCustomersData, outstandingData, metricsData] = await Promise.all([
        getTopCustomers(),
        getOutstandingBalanceCustomers(),
        getDashboardCustomers('thisWeek')
      ]);
      
      setTopCustomers(topCustomersData);
      setOutstandingCustomers(outstandingData);
      setCustomerMetrics(metricsData);
    } catch (error: any) {
      console.error('Error fetching summary data:', error);
      showError('Error', 'Failed to load summary data');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Handle customer creation
  const handleCreateCustomer = async (customerData: any) => {
    try {
      // Transform the data to match backend's expected format
      const transformedData = {
        name: `${customerData.firstName} ${customerData.lastName}`.trim(),
        email: customerData.email,
        phone: customerData.phone.startsWith('+') ? customerData.phone : `${customerData.countryCode}${customerData.phone}`,
        address: customerData.address,
        creditLimit: 0 // Default credit limit as expected by backend
      };
      
      const newCustomer = await createCustomer(transformedData);
      setCustomers(prev => [newCustomer, ...prev]);
      showSuccess('Success', 'Customer created successfully');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error('Error creating customer:', err);
      showError('Error', err.message || 'Failed to create customer');
    }
  };

  // Handle customer update
  const handleUpdateCustomer = async (id: string, customerData: any) => {
    try {
      const updatedCustomer = await updateCustomer(id, customerData);
      setCustomers(prev => prev.map(customer => 
        customer.id === id ? updatedCustomer : customer
      ));
      showSuccess('Success', 'Customer updated successfully');
    } catch (err: any) {
      console.error('Error updating customer:', err);
      showError('Error', err.message || 'Failed to update customer');
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      showSuccess('Success', 'Customer deleted successfully');
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      showError('Error', err.message || 'Failed to delete customer');
    }
  };

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
    // Fetch customer metrics on page load
    const fetchCustomerMetrics = async () => {
      try {
        const metricsData = await getDashboardCustomers('thisWeek');
        setCustomerMetrics(metricsData);
      } catch (error: any) {
        console.error('Error fetching customer metrics:', error);
        // Don't show error notification for metrics as it's not critical
      }
    };
    fetchCustomerMetrics();
  }, []);

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
  };


  const copyToClipboard = (text: string | undefined) => {
    if (text) {
    navigator.clipboard.writeText(text);
    }
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
                <button
                  onClick={() => {
                    if (!showSummary) {
                      fetchSummaryData();
                    }
                    setShowSummary(!showSummary);
                  }}
                  className="px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors text-sm font-medium"
                >
                  {showSummary ? 'Hide Summary' : 'View Detailed Summary'}
                </button>
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
                  <span className={`text-xs font-medium ${(customerMetrics?.allCustomers?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(customerMetrics?.allCustomers?.change || 0) >= 0 ? '+' : ''}{(customerMetrics?.allCustomers?.change || 0).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerMetrics?.allCustomers?.value || 0}</h3>
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
                  <span className={`text-xs font-medium ${(customerMetrics?.activeCustomers?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(customerMetrics?.activeCustomers?.change || 0) >= 0 ? '+' : ''}{(customerMetrics?.activeCustomers?.change || 0).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerMetrics?.activeCustomers?.value || 0}</h3>
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
                  <span className={`text-xs font-medium ${(customerMetrics?.inactiveCustomers?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(customerMetrics?.inactiveCustomers?.change || 0) >= 0 ? '+' : ''}{(customerMetrics?.inactiveCustomers?.change || 0).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerMetrics?.inactiveCustomers?.value || 0}</h3>
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
                  <span className={`text-xs font-medium ${(customerMetrics?.newCustomers?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(customerMetrics?.newCustomers?.change || 0) >= 0 ? '+' : ''}{(customerMetrics?.newCustomers?.change || 0).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerMetrics?.newCustomers?.value || 0}</h3>
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
                  <span className={`text-xs font-medium ${(customerMetrics?.purchasingCustomers?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(customerMetrics?.purchasingCustomers?.change || 0) >= 0 ? '+' : ''}{(customerMetrics?.purchasingCustomers?.change || 0).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerMetrics?.purchasingCustomers?.value || 0}</h3>
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
                  <span className={`text-xs font-medium ${(customerMetrics?.abandonedCarts?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(customerMetrics?.abandonedCarts?.change || 0) >= 0 ? '+' : ''}{(customerMetrics?.abandonedCarts?.change || 0).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerMetrics?.abandonedCarts?.value || 0}</h3>
                <p className="text-sm text-gray-600">Abandoned Carts</p>
              </div>
            </div>
          </div>

          {/* Detailed Summary Section */}
          {showSummary && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Detailed Customer Summary</h2>
              </div>
              
              {summaryLoading ? (
                <div className="p-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading summary data...</p>
                </div>
              ) : (
                <div className="p-6">
                  {/* Customer Metrics Cards */}
                  {customerMetrics && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Metrics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* Total Customers */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600">{customerMetrics.allCustomers.value}</div>
                          <div className="text-sm text-blue-600">Total Customers</div>
                          <div className={`text-xs mt-1 ${customerMetrics.allCustomers.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {customerMetrics.allCustomers.change >= 0 ? '+' : ''}{customerMetrics.allCustomers.change.toFixed(1)}%
                          </div>
                        </div>

                        {/* Active Customers */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-600">{customerMetrics.activeCustomers.value}</div>
                          <div className="text-sm text-green-600">Active</div>
                          <div className={`text-xs mt-1 ${customerMetrics.activeCustomers.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {customerMetrics.activeCustomers.change >= 0 ? '+' : ''}{customerMetrics.activeCustomers.change.toFixed(1)}%
                          </div>
                        </div>

                        {/* Inactive Customers */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="text-2xl font-bold text-gray-600">{customerMetrics.inactiveCustomers.value}</div>
                          <div className="text-sm text-gray-600">Inactive</div>
                          <div className={`text-xs mt-1 ${customerMetrics.inactiveCustomers.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {customerMetrics.inactiveCustomers.change >= 0 ? '+' : ''}{customerMetrics.inactiveCustomers.change.toFixed(1)}%
                          </div>
                        </div>

                        {/* New Customers */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <div className="text-2xl font-bold text-purple-600">{customerMetrics.newCustomers.value}</div>
                          <div className="text-sm text-purple-600">New This Week</div>
                          <div className={`text-xs mt-1 ${customerMetrics.newCustomers.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {customerMetrics.newCustomers.change >= 0 ? '+' : ''}{customerMetrics.newCustomers.change.toFixed(1)}%
                          </div>
                        </div>

                        {/* Purchasing Customers */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <div className="text-2xl font-bold text-orange-600">{customerMetrics.purchasingCustomers.value}</div>
                          <div className="text-sm text-orange-600">Purchasing</div>
                          <div className={`text-xs mt-1 ${customerMetrics.purchasingCustomers.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {customerMetrics.purchasingCustomers.change >= 0 ? '+' : ''}{customerMetrics.purchasingCustomers.change.toFixed(1)}%
                          </div>
                        </div>

                        {/* Abandoned Carts */}
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="text-2xl font-bold text-red-600">{customerMetrics.abandonedCarts.value}</div>
                          <div className="text-sm text-red-600">Abandoned Carts</div>
                          <div className={`text-xs mt-1 ${customerMetrics.abandonedCarts.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {customerMetrics.abandonedCarts.change >= 0 ? '+' : ''}{customerMetrics.abandonedCarts.change.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Customers */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
                      <div className="space-y-3">
                        {topCustomers.length > 0 ? (
                          topCustomers.slice(0, 5).map((customer, index) => (
                            <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{customer.name}</p>
                                  <p className="text-sm text-gray-600">{customer.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">{customer.orders || 0} orders</p>
                                <p className="text-sm text-gray-600">₦{(customer.orderTotal || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No top customers data available</p>
                        )}
                      </div>
                    </div>

                    {/* Outstanding Balance Customers */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Balances</h3>
                      <div className="space-y-3">
                        {outstandingCustomers.length > 0 ? (
                          outstandingCustomers.slice(0, 5).map((customer) => (
                            <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{customer.name}</p>
                                  <p className="text-sm text-gray-600">{customer.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-red-600">₦{customer.outstandingBalance.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Credit: ₦{customer.creditLimit.toLocaleString()}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No outstanding balances</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

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
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02016a]"></div>
                          <span className="ml-2 text-gray-600">Loading customers...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <div className="text-red-600">
                          <p className="font-medium">Error loading customers</p>
                          <p className="text-sm mt-1">{error}</p>
                          <button 
                            onClick={fetchCustomers}
                            className="mt-2 px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No customers found</p>
                          <p className="text-sm mt-1">Create your first customer to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
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
                            onClick={() => copyToClipboard(customer.email)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
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
                            onClick={() => copyToClipboard(customer.phone)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
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
                        ₦{(customer.orderTotal || 0).toLocaleString()}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                    <span className="text-sm text-gray-700">Items per page</span>
                  </div>
                  <span className="text-sm text-gray-700">1-5 of 200 items</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                  <span className="text-sm text-gray-700">of 44 pages</span>
                  <div className="flex gap-1">
                    <button className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
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
      
      {/* Notifications */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
}
