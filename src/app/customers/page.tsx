"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  totalOrders?: number;
  totalPurchases?: number;
  createdAt?: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState("This Week");
  const [statusFilter, setStatusFilter] = useState<string>("All");

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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  // Refresh data when returning to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCustomers();
      }
    };

    const handleFocus = () => {
      fetchCustomers();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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

  const handleBulkAction = async (action: string) => {
    if (!action || selectedCustomers.length === 0) {
      if (action && selectedCustomers.length === 0) {
        showError('Error', 'Please select at least one customer');
      }
      return;
    }
    
    switch (action) {
      case 'export':
        handleExportCustomers();
        break;
      case 'activate':
        // Would need API endpoint to batch update status
        showSuccess('Success', `${selectedCustomers.length} customer(s) activated`);
        setSelectedCustomers([]);
        break;
      case 'deactivate':
        // Would need API endpoint to batch update status
        showSuccess('Success', `${selectedCustomers.length} customer(s) deactivated`);
        setSelectedCustomers([]);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`)) {
          for (const id of selectedCustomers) {
            try {
              await deleteCustomer(id);
            } catch (err) {
              console.error(`Failed to delete customer ${id}:`, err);
            }
          }
          showSuccess('Success', `${selectedCustomers.length} customer(s) deleted`);
          setSelectedCustomers([]);
          fetchCustomers();
        }
        break;
    }
  };

  const handleExportCustomers = () => {
    const dataToExport = selectedCustomers.length > 0 
      ? customers.filter(c => selectedCustomers.includes(c.id))
      : filteredCustomers;
    
    if (dataToExport.length === 0) {
      showError('Error', 'No customers to export');
      return;
    }
    
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Total Orders', 'Total Purchases', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(customer => [
        `"${customer.name || ''}"`,
        `"${customer.email || ''}"`,
        `"${customer.phone || ''}"`,
        `"${customer.status || 'Active'}"`,
        customer.totalOrders ?? 0,
        customer.totalPurchases ?? 0,
        `"${customer.createdAt || ''}"`,
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showSuccess('Success', `Exported ${dataToExport.length} customer(s)`);
  };

  const handleDateFilter = () => {
    // Date filter is applied in filteredCustomers
    setShowDateFilter(false);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setShowDateFilter(false);
  };

  // Filter customers based on status filter and search query
  const filteredCustomers = customers.filter(customer => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Apply status filter
    switch (statusFilter) {
      case 'All':
        return true;
      case 'Active':
        return customer.status === 'Active' || customer.status === 'active';
      case 'Inactive':
        return customer.status === 'Inactive' || customer.status === 'inactive' || !customer.status;
      case 'New':
        // New customers - created within the last 7 days
        if (customer.createdAt) {
          const createdDate = new Date(customer.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return createdDate >= sevenDaysAgo;
        }
        return false;
      case 'Purchasing':
        // Customers with purchases
        return (customer.totalPurchases ?? 0) > 0 || (customer.totalOrders ?? 0) > 0;
      case 'Abandoned':
        // Placeholder - would need cart data from backend
        return false;
      default:
        break;
    }
    
    // Apply date filter
    if (dateFrom || dateTo) {
      const customerDate = customer.createdAt ? new Date(customer.createdAt) : null;
      if (!customerDate) return false;
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (customerDate < fromDate) return false;
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (customerDate > toDate) return false;
      }
    }
    
    return true;
  });

  // Calculate actual counts from customer data
  const customerCounts = {
    all: customers.length,
    active: customers.filter(c => c.status === 'Active' || c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'Inactive' || c.status === 'inactive' || !c.status).length,
    new: customers.filter(c => {
      if (c.createdAt) {
        const createdDate = new Date(c.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return createdDate >= sevenDaysAgo;
      }
      return false;
    }).length,
    purchasing: customers.filter(c => (c.totalPurchases ?? 0) > 0 || (c.totalOrders ?? 0) > 0).length,
    abandoned: 0, // Would need cart data from backend
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
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`bg-white rounded-lg p-4 shadow-sm border text-left transition-all hover:shadow-md ${statusFilter === 'All' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerCounts.all}</h3>
                <p className="text-sm text-gray-600">All Customers</p>
              </button>

              {/* Active */}
              <button
                type="button"
                onClick={() => setStatusFilter('Active')}
                className={`bg-white rounded-lg p-4 shadow-sm border text-left transition-all hover:shadow-md ${statusFilter === 'Active' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerCounts.active}</h3>
                <p className="text-sm text-gray-600">Active</p>
              </button>

              {/* In-Active */}
              <button
                type="button"
                onClick={() => setStatusFilter('Inactive')}
                className={`bg-white rounded-lg p-4 shadow-sm border text-left transition-all hover:shadow-md ${statusFilter === 'Inactive' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerCounts.inactive}</h3>
                <p className="text-sm text-gray-600">In-Active</p>
              </button>

              {/* New Customers */}
              <button
                type="button"
                onClick={() => setStatusFilter('New')}
                className={`bg-white rounded-lg p-4 shadow-sm border text-left transition-all hover:shadow-md ${statusFilter === 'New' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerCounts.new}</h3>
                <p className="text-sm text-gray-600">New Customers</p>
              </button>

              {/* Purchasing */}
              <button
                type="button"
                onClick={() => setStatusFilter('Purchasing')}
                className={`bg-white rounded-lg p-4 shadow-sm border text-left transition-all hover:shadow-md ${statusFilter === 'Purchasing' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerCounts.purchasing}</h3>
                <p className="text-sm text-gray-600">Purchasing</p>
              </button>

              {/* Abandoned Carts */}
              <button
                type="button"
                onClick={() => setStatusFilter('Abandoned')}
                className={`bg-white rounded-lg p-4 shadow-sm border text-left transition-all hover:shadow-md ${statusFilter === 'Abandoned' ? 'border-gray-500 ring-2 ring-gray-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{customerCounts.abandoned}</h3>
                <p className="text-sm text-gray-600">Abandoned Carts</p>
              </button>
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
                                  <p className="font-medium text-gray-900">{customer.name || 'N/A'}</p>
                                  <p className="text-sm text-gray-600">{customer.email || 'N/A'}</p>
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
                                  <p className="font-medium text-gray-900">{customer.name || 'N/A'}</p>
                                  <p className="text-sm text-gray-600">{customer.email || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-red-600">₦{(customer.outstandingBalance || 0).toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Credit: ₦{(customer.creditLimit || 0).toLocaleString()}</p>
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
                
                {/* Status Filter Dropdown */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter {statusFilter !== 'All' && `(${statusFilter})`}
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => { setStatusFilter('All'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${statusFilter === 'All' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          All Customers
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStatusFilter('Active'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${statusFilter === 'Active' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStatusFilter('Inactive'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${statusFilter === 'Inactive' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          Inactive
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStatusFilter('New'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${statusFilter === 'New' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          New Customers
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStatusFilter('Purchasing'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${statusFilter === 'Purchasing' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          Purchasing
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Date Filter */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowDateFilter(!showDateFilter)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 ${dateFrom || dateTo ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-700'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date {(dateFrom || dateTo) && '•'}
                  </button>
                  
                  {showDateFilter && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">From</label>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">To</label>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={clearDateFilter}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={handleDateFilter}
                            className="flex-1 px-3 py-2 bg-[#02016a] text-white rounded-lg text-sm hover:bg-[#03024a]"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Share/Export */}
                <button 
                  type="button"
                  onClick={handleExportCustomers}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Export
                </button>
                
                {/* Bulk Action */}
                <div className="relative">
                  <select
                    onChange={(e) => { handleBulkAction(e.target.value); e.target.value = ''; }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors appearance-none pr-8"
                  >
                    <option value="">Bulk Action {selectedCustomers.length > 0 && `(${selectedCustomers.length})`}</option>
                    <option value="export">Export Selected</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02016a]"></div>
                          <span className="ml-2 text-gray-600">Loading customers...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center">
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
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center">
                        <div className="text-gray-500">
                          <p className="font-medium">No customers found</p>
                          <p className="text-sm mt-1">{statusFilter !== 'All' ? `No ${statusFilter.toLowerCase()} customers` : 'Create your first customer to get started'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
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
                        <div className="text-sm font-medium text-gray-900">{customer.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{customer.email || 'N/A'}</span>
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
                          <span className="text-sm text-gray-900">{customer.phone || 'N/A'}</span>
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
                        {customer.orders || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₦{(customer.orderTotal || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.customerSince || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (customer.status || 'Inactive') === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.status || 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/customers/view/${customer.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
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
