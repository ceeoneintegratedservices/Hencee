"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getTopCustomers, 
  getOutstandingBalanceCustomers, 
  getCustomerStats,
  listCustomers,
  type TopCustomer,
  type OutstandingBalanceCustomer,
  type CustomerStats,
  type CustomerRecord
} from "@/services/customers";
import { useNotifications } from "@/components/Notification";
import { NotificationContainer } from "@/components/Notification";

export default function CustomerSummaryPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();
  
  // State for different data sections
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [outstandingCustomers, setOutstandingCustomers] = useState<OutstandingBalanceCustomer[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomerStats, setSelectedCustomerStats] = useState<CustomerStats | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  
  // Loading states
  const [topCustomersLoading, setTopCustomersLoading] = useState(false);
  const [outstandingLoading, setOutstandingLoading] = useState(false);
  const [allCustomersLoading, setAllCustomersLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Error states
  const [topCustomersError, setTopCustomersError] = useState<string | null>(null);
  const [outstandingError, setOutstandingError] = useState<string | null>(null);
  const [allCustomersError, setAllCustomersError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch top customers
  const fetchTopCustomers = async () => {
    setTopCustomersLoading(true);
    setTopCustomersError(null);
    try {
      const data = await getTopCustomers(10);
      setTopCustomers(data);
    } catch (error: any) {
      console.error('Error fetching top customers:', error);
      setTopCustomersError(error.message || 'Failed to load top customers');
      showError('Error', error.message || 'Failed to load top customers');
    } finally {
      setTopCustomersLoading(false);
    }
  };

  // Fetch outstanding balance customers
  const fetchOutstandingCustomers = async () => {
    setOutstandingLoading(true);
    setOutstandingError(null);
    try {
      const data = await getOutstandingBalanceCustomers();
      setOutstandingCustomers(data);
    } catch (error: any) {
      console.error('Error fetching outstanding customers:', error);
      setOutstandingError(error.message || 'Failed to load outstanding customers');
      showError('Error', error.message || 'Failed to load outstanding customers');
    } finally {
      setOutstandingLoading(false);
    }
  };

  // Fetch all customers
  const fetchAllCustomers = async () => {
    setAllCustomersLoading(true);
    setAllCustomersError(null);
    try {
      const data = await listCustomers({ limit: 100 });
      setAllCustomers(data);
    } catch (error: any) {
      console.error('Error fetching all customers:', error);
      setAllCustomersError(error.message || 'Failed to load customers');
      showError('Error', error.message || 'Failed to load customers');
    } finally {
      setAllCustomersLoading(false);
    }
  };

  // Fetch customer stats
  const fetchCustomerStats = async (customerId: string) => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await getCustomerStats(customerId);
      setSelectedCustomerStats(data);
    } catch (error: any) {
      console.error('Error fetching customer stats:', error);
      setStatsError(error.message || 'Failed to load customer stats');
      showError('Error', error.message || 'Failed to load customer stats');
    } finally {
      setStatsLoading(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    fetchCustomerStats(customer.id);
  };

  // Load data on component mount
  useEffect(() => {
    fetchTopCustomers();
    fetchOutstandingCustomers();
    fetchAllCustomers();
  }, []);

  // Calculate summary statistics
  const totalCustomers = allCustomers.length;
  const totalOutstandingBalance = outstandingCustomers.reduce((sum, customer) => sum + customer.outstandingBalance, 0);
  const averageCustomerValue = topCustomers.length > 0 
    ? topCustomers.reduce((sum, customer) => sum + customer.totalAmount, 0) / topCustomers.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationContainer />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Summary</h1>
              <p className="text-gray-600 mt-1">Comprehensive customer analytics and insights</p>
            </div>
            <button
              onClick={() => router.push('/customers')}
              className="px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
            >
              View All Customers
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Customers</p>
                <p className="text-2xl font-bold text-gray-900">{topCustomers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                <p className="text-2xl font-bold text-gray-900">₦{totalOutstandingBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Customer Value</p>
                <p className="text-2xl font-bold text-gray-900">₦{averageCustomerValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Customers</h2>
              <p className="text-sm text-gray-600">Best performing customers by total amount</p>
            </div>
            <div className="p-6">
              {topCustomersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02016a]"></div>
                  <span className="ml-2 text-gray-600">Loading top customers...</span>
                </div>
              ) : topCustomersError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 font-medium">Error loading top customers</p>
                  <p className="text-sm text-gray-500 mt-1">{topCustomersError}</p>
                  <button
                    onClick={fetchTopCustomers}
                    className="mt-2 px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : topCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No top customers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#02016a] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₦{customer.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{customer.totalPurchases} purchases</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Outstanding Balance Customers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Outstanding Balances</h2>
              <p className="text-sm text-gray-600">Customers with outstanding payments</p>
            </div>
            <div className="p-6">
              {outstandingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02016a]"></div>
                  <span className="ml-2 text-gray-600">Loading outstanding customers...</span>
                </div>
              ) : outstandingError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 font-medium">Error loading outstanding customers</p>
                  <p className="text-sm text-gray-500 mt-1">{outstandingError}</p>
                  <button
                    onClick={fetchOutstandingCustomers}
                    className="mt-2 px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : outstandingCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No outstanding balances</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outstandingCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">₦{customer.outstandingBalance.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Limit: ₦{customer.creditLimit.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
              <p className="text-sm text-gray-600">Select a customer to view detailed statistics</p>
            </div>
            <div className="p-6">
              {allCustomersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02016a]"></div>
                  <span className="ml-2 text-gray-600">Loading customers...</span>
                </div>
              ) : allCustomersError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 font-medium">Error loading customers</p>
                  <p className="text-sm text-gray-500 mt-1">{allCustomersError}</p>
                  <button
                    onClick={fetchAllCustomers}
                    className="mt-2 px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? 'border-[#02016a] bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                          <p className="text-xs text-gray-500">
                            {customer.status || 'Active'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Customer Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Customer Statistics</h2>
              <p className="text-sm text-gray-600">
                {selectedCustomer ? `Statistics for ${selectedCustomer.name}` : 'Select a customer to view statistics'}
              </p>
            </div>
            <div className="p-6">
              {!selectedCustomer ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-500">Select a customer to view their statistics</p>
                </div>
              ) : statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02016a]"></div>
                  <span className="ml-2 text-gray-600">Loading statistics...</span>
                </div>
              ) : statsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 font-medium">Error loading statistics</p>
                  <p className="text-sm text-gray-500 mt-1">{statsError}</p>
                  <button
                    onClick={() => fetchCustomerStats(selectedCustomer.id)}
                    className="mt-2 px-4 py-2 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : selectedCustomerStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">Total Purchases</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedCustomerStats.totalPurchases}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-600">Total Amount</p>
                      <p className="text-2xl font-bold text-green-900">₦{selectedCustomerStats.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-600">Outstanding Balance</p>
                      <p className="text-2xl font-bold text-yellow-900">₦{selectedCustomerStats.outstandingBalance.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-600">Average Purchase</p>
                      <p className="text-2xl font-bold text-purple-900">₦{selectedCustomerStats.averagePurchaseAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedCustomerStats.lastPurchaseDate && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Last Purchase</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(selectedCustomerStats.lastPurchaseDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No statistics available for this customer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
