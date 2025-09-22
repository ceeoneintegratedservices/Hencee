"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FilterModal from "../../components/FilterModal";
import FilterByDateModal from "../../components/FilterByDateModal";
import CreateOrderModal from "../../components/CreateOrderModal";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Breadcrumb from "../../components/Breadcrumb";
import TimePeriodSelector from "../../components/TimePeriodSelector";
import { OrderDataService, Order } from "../../services/OrderDataService";
import { NotificationContainer, useNotifications } from "../../components/Notification";
import { fetchSalesDashboard } from "../../services/sales";
import type { SalesDashboardResponse } from "../../types/sales";

export default function OrdersPage() {
  const router = useRouter();
  const { notifications, removeNotification, showSuccess } = useNotifications();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState<number | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<"This Week" | "This Month">("This Week");
  // Sidebar toggle for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // API data state
  const [apiData, setApiData] = useState<SalesDashboardResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleFilterApply = (filters: any) => {
    setAppliedFilters({ ...appliedFilters, ...filters });
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDateFilterApply = (dateFilter: any) => {
    setAppliedFilters({ ...appliedFilters, dateFilter });
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleCreateOrder = (orderData: any) => {
    // Implement order creation logic here
  };

  // Handle time period selection
  const handleTimePeriodChange = (period: "This Week" | "This Month") => {
    setSelectedTimePeriod(period);
  };

  // Fetch real orders from API
  useEffect(() => {
    let aborted = false;
    async function run() {
      setApiLoading(true);
      setApiError(null);
      try {
        const sortByMap: Record<string, string> = {
          "Customer Name": "customerName",
          "Order Date": "orderDate",
          "Order Type": "orderType",
          "Tracking ID": "trackingId",
          "Order Total": "orderTotal",
          "Status": "status",
        };
        const sortBy = sortColumn ? sortByMap[sortColumn] : undefined;
        const statusParam = appliedFilters?.status && appliedFilters.status !== "All" ? String(appliedFilters.status) : undefined;
        const df = appliedFilters?.dateFilter?.from || appliedFilters?.dateFilter?.start || undefined;
        const dt = appliedFilters?.dateFilter?.to || appliedFilters?.dateFilter?.end || undefined;
        const res = await fetchSalesDashboard({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          status: statusParam,
          dateFrom: df,
          dateTo: dt,
          sortBy,
          sortDir: (sortDirection as "asc" | "desc") || undefined,
        });
        if (!aborted) setApiData(res);
      } catch (e: any) {
        if (!aborted) setApiError(e?.message || "Failed to load orders");
      } finally {
        if (!aborted) setApiLoading(false);
      }
    }
    run();
    return () => { aborted = true; };
  }, [currentPage, itemsPerPage, searchTerm, appliedFilters, sortColumn, sortDirection]);

  // Generate orders using the service
  const sampleOrders = (apiData
    ? apiData.orders.map(o => {
        const colorMap: Record<string, string> = {
          green: 'bg-green-100 text-green-800',
          orange: 'bg-orange-100 text-orange-800',
          blue: 'bg-blue-100 text-blue-800',
          red: 'bg-red-100 text-red-800',
        };
        return {
          id: o.id,
          name: o.customerName,
          date: o.orderDate,
          type: o.orderType,
          tracking: o.trackingId,
          total: o.orderTotal,
          action: o.action,
          status: o.status,
          statusColor: o.statusColor ? (colorMap[o.statusColor] || 'bg-gray-100 text-gray-800') : 'bg-gray-100 text-gray-800',
        };
      })
    : OrderDataService.generateOrders(200).map(order => ({
        id: order.id,
        name: order.customer.name,
        date: order.orderDate,
        type: order.orderType,
        tracking: order.trackingId,
        total: OrderDataService.formatCurrency(order.totalAmount),
        action: order.status,
        status: order.status,
        statusColor: order.statusColor
      }))
  );
  
  // Apply search filter
  const filteredOrders = sampleOrders.filter(order => {
    if (!searchTerm) return true;
    return order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.tracking.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Apply other filters
  const finalFilteredOrders = filteredOrders.filter(order => {
    if (appliedFilters.orderType && appliedFilters.orderType.length > 0) {
      if (!appliedFilters.orderType.includes(order.type)) return false;
    }
    if (appliedFilters.status && appliedFilters.status !== "All") {
      if (order.status !== appliedFilters.status) return false;
    }
    if (appliedFilters.customer && appliedFilters.customer !== "All") {
      if (order.name !== appliedFilters.customer) return false;
    }
    return true;
  });

  // Apply sorting
  const sortedOrders = [...finalFilteredOrders].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue: any;
    let bValue: any;
    
    if (sortColumn === "Customer Name") {
      aValue = a.name;
      bValue = b.name;
    } else if (sortColumn === "Order Date") {
      aValue = a.date;
      bValue = b.date;
    } else if (sortColumn === "Order Type") {
      aValue = a.type;
      bValue = b.type;
    } else if (sortColumn === "Tracking ID") {
      aValue = a.tracking;
      bValue = b.tracking;
    } else if (sortColumn === "Order Total") {
      aValue = parseFloat(a.total.replace(/[^\d]/g, ''));
      bValue = parseFloat(b.total.replace(/[^\d]/g, ''));
    } else if (sortColumn === "Status") {
      aValue = a.status;
      bValue = b.status;
    } else {
      return 0;
    }
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalPages = apiData ? Math.ceil((apiData.total || 0) / itemsPerPage) : Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = apiData ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = apiData ? (apiData.orders?.length ?? 0) : startIndex + itemsPerPage;
  const currentOrders = apiData ? sampleOrders : sortedOrders.slice(startIndex, endIndex);

  // Summary numbers from API (fallback to local if API unavailable)
  const timePeriodData = apiData ? {
    allOrders: apiData.summary.allOrders,
    pendingOrders: apiData.summary.pending,
    completedOrders: apiData.summary.completed,
    canceledOrders: apiData.summary.canceled,
    returnedOrders: apiData.summary.returned,
    damagedOrders: apiData.summary.damaged,
    abandonedCarts: apiData.summary.abandonedCart,
    uniqueCustomers: apiData.summary.customers,
  } : (() => {
    const fullOrders = OrderDataService.generateOrders(200);
    const summaryData = OrderDataService.getOrderSummary(fullOrders);
    return {
      allOrders: summaryData.allOrders,
      pendingOrders: summaryData.pendingOrders,
      completedOrders: summaryData.completedOrders,
      canceledOrders: summaryData.canceledOrders,
      returnedOrders: summaryData.returnedOrders,
      damagedOrders: summaryData.damagedOrders,
      abandonedCarts: Math.floor(fullOrders.length * 0.15),
      uniqueCustomers: new Set(fullOrders.map(order => order.customer.name)).size,
    };
  })();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSelectOrder = (index: number) => {
    setSelectedOrders(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === currentOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(currentOrders.map((_, index) => index));
    }
  };

  const handleBulkAction = (action: string) => {
    // Implement bulk actions here
  };

  const handleShare = () => {
    // Implement share functionality here
  };

  const handleRowAction = (action: string, orderIndex: number) => {
    // Implement individual row actions here
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleStatusChange = (orderIndex: number, newStatus: string) => {
    // Update the order status in the sample data
    const updatedOrders = [...sampleOrders];
    const globalOrderIndex = startIndex + orderIndex;
    if (updatedOrders[globalOrderIndex]) {
      const orderId = updatedOrders[globalOrderIndex].id;
      updatedOrders[globalOrderIndex].status = newStatus as any;
      
      // Update status color based on new status
      const statusColors = {
        'Completed': 'bg-green-100 text-green-800',
        'In-Progress': 'bg-blue-100 text-blue-800', 
        'Pending': 'bg-orange-100 text-orange-800',
        'Canceled': 'bg-red-100 text-red-800',
        'Returned': 'bg-yellow-100 text-yellow-800',
        'Damaged': 'bg-purple-100 text-purple-800'
      };
      updatedOrders[globalOrderIndex].statusColor = statusColors[newStatus as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
      
      // Persist the status change to localStorage
      const statusChanges = JSON.parse(localStorage.getItem('orderStatusChanges') || '{}');
      statusChanges[orderId] = newStatus;
      localStorage.setItem('orderStatusChanges', JSON.stringify(statusChanges));
      
      // Show success notification
      showSuccess(
        "Status Updated",
        `Order status changed to ${newStatus} successfully!`
      );
    }
    
    // In a real app, you would update the orders state here
    // setOrders(updatedOrders);
    
    setShowActionDropdown(null);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (showBulkDropdown && !target.closest('.bulk-dropdown-container')) {
        setShowBulkDropdown(false);
      }
      
      if (showActionDropdown !== null && !target.closest('.action-dropdown-container')) {
        setShowActionDropdown(null);
      }
      
      if (showMobileMenu && !target.closest('.mobile-menu-container')) {
        setShowMobileMenu(false);
      }
    };

    if (showBulkDropdown || showActionDropdown !== null || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBulkDropdown, showActionDropdown, showMobileMenu]);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      const hasAuth = token || userData;
      
      if (!hasAuth) {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }
    };

    const timer = setTimeout(checkAuth, 100);
    const backupTimer = setTimeout(checkAuth, 500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(backupTimer);
    };
  }, [router]);

  // Handle sidebar keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex w-full h-screen bg-[#f4f5fa] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-[#f4f5fa] overflow-hidden">
      {/* Notifications */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Sidebar */}
      <Sidebar 
        currentPage="orders"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Header */}
        <Header title="Orders" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        {/* Breadcrumbs */}
        <Breadcrumb items={[
          { label: "Orders" }
        ]} />

        <div className="px-3 sm:px-5 pt-7 relative">
          {/* Header Row with Orders Summary and Create Order Button */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h2 className="text-[18px] font-semibold text-[#45464e]">Orders Summary</h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-[#02016a] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#03024a] transition-colors w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create a New Order
            </button>
          </div>

          {/* Orders Summary Section */}
          <section className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* All Orders Card */}
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-[#f4f5fa] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#45464e]" fill="none" viewBox="0 0 20 21">
                      <path d="M14.2126 20.222H5.86477C2.79841 20.222 0.446004 19.1145 1.1142 14.6568L1.89223 8.6156C2.30413 6.39134 3.72289 5.54008 4.96774 5.54008H15.1462C16.4094 5.54008 17.7458 6.45542 18.2217 8.6156L18.9998 14.6568C19.5673 18.611 17.279 20.222 14.2126 20.222Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.3499 5.32041C14.3499 2.93433 12.4156 1.00004 10.0295 1.00004V1.00004C8.88053 0.99517 7.77692 1.4482 6.96273 2.25895C6.14854 3.06971 5.69085 4.17139 5.69086 5.32041H5.69086" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <TimePeriodSelector
                    selectedTimePeriod={selectedTimePeriod}
                    onTimePeriodChange={handleTimePeriodChange}
                    textColor="#8b8d97"
                    iconColor="#8B8D97"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-[#8b8d97] mb-1">All Orders</div>
                    <div className="font-semibold text-[#45464e] text-lg">{timePeriodData.allOrders}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-[#8b8d97] mb-1">Pending</div>
                    <div className="font-semibold text-[#45464e] text-lg">{timePeriodData.pendingOrders}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-[#8b8d97] mb-1">Completed</div>
                    <div className="font-semibold text-[#45464e] text-lg">{timePeriodData.completedOrders}</div>
                  </div>
                </div>
              </div>

              {/* Order Issues Card */}
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-[#f4f5fa] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#45464e]" fill="none" viewBox="0 0 20 21">
                      <path d="M14.2126 20.222H5.86477C2.79841 20.222 0.446004 19.1145 1.1142 14.6568L1.89223 8.6156C2.30413 6.39134 3.72289 5.54008 4.96774 5.54008H15.1462C16.4094 5.54008 17.7458 6.45542 18.2217 8.6156L18.9998 14.6568C19.5673 18.611 17.279 20.222 14.2126 20.222Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.3499 5.32041C14.3499 2.93433 12.4156 1.00004 10.0295 1.00004V1.00004C8.88053 0.99517 7.77692 1.4482 6.96273 2.25895C6.14854 3.06971 5.69085 4.17139 5.69086 5.32041H5.69086" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <TimePeriodSelector
                    selectedTimePeriod={selectedTimePeriod}
                    onTimePeriodChange={handleTimePeriodChange}
                    textColor="#8b8d97"
                    iconColor="#8B8D97"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-[#8b8d97] mb-1">Canceled</div>
                    <div className="font-semibold text-[#45464e] text-lg">{timePeriodData.canceledOrders}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-[#8b8d97] mb-1">Returned</div>
                    <div className="font-semibold text-[#45464e] text-lg">{timePeriodData.returnedOrders}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-[#8b8d97] mb-1">Damaged</div>
                    <div className="font-semibold text-[#45464e] text-lg">{timePeriodData.damagedOrders}</div>
                  </div>
                </div>
              </div>

              {/* Abandoned Cart Card */}
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-[#f4f5fa] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#45464e]" fill="none" viewBox="0 0 20 21">
                      <path d="M14.2126 20.222H5.86477C2.79841 20.222 0.446004 19.1145 1.1142 14.6568L1.89223 8.6156C2.30413 6.39134 3.72289 5.54008 4.96774 5.54008H15.1462C16.4094 5.54008 17.7458 6.45542 18.2217 8.6156L18.9998 14.6568C19.5673 18.611 17.279 20.222 14.2126 20.222Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.3499 5.32041C14.3499 2.93433 12.4156 1.00004 10.0295 1.00004V1.00004C8.88053 0.99517 7.77692 1.4482 6.96273 2.25895C6.14854 3.06971 5.69085 4.17139 5.69086 5.32041H5.69086" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <TimePeriodSelector
                    selectedTimePeriod={selectedTimePeriod}
                    onTimePeriodChange={handleTimePeriodChange}
                    textColor="#8b8d97"
                    iconColor="#8B8D97"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-[#8b8d97] mb-1">Abandoned Cart</div>
                    <div className="font-semibold text-[#45464e] text-lg">{timePeriodData.abandonedCarts}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-[#8b8d97] mb-1">Customers</div>
                    <div className="font-semibold text-[#45464e] text-lg">{timePeriodData.uniqueCustomers}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Customer Orders Section - Data Table */}
          <section className="mb-4 relative">
            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {/* Table Header with Controls */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                {/* Title and Controls Row */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                  {/* Customer Orders Title - Top Left */}
                  <h2 className="text-[18px] font-semibold text-[#45464e]">Customer Orders</h2>
                  
                  {/* Controls - Top Right */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-auto">
                    <input 
                      type="text" 
                      placeholder="Search" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                    />
                    <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" />
                    </svg>
                  </div>
                  
                  {/* Filter Button */}
                  <button 
                    onClick={() => setShowFilterModal(true)}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" stroke="currentColor" />
                    </svg>
                    Filter
                  </button>
                  
                  {/* Filter by Date Button */}
                  <button 
                    onClick={() => setShowDateFilterModal(true)}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" />
                    </svg>
                    Filter
                  </button>
                  
                  {/* Share Button */}
                  <button 
                    onClick={handleShare}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" stroke="currentColor" />
                    </svg>
                    Share
                  </button>
                  
                  {/* Mobile Menu Button */}
                  <div className="relative mobile-menu-container">
                    <button 
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="sm:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" stroke="currentColor" />
                      </svg>
                      More
                    </button>
                    
                    {showMobileMenu && (
                      <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-80 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-w-[calc(100vw-2rem)]">
                        <div className="py-2">
                          <button 
                            onClick={() => { setShowFilterModal(true); setShowMobileMenu(false); }}
                            className="w-full text-left px-6 py-4 text-sm text-[#45464e] hover:bg-gray-50 flex items-center gap-4"
                          >
                            <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" stroke="currentColor" />
                            </svg>
                            <span className="whitespace-nowrap text-base">Filter Orders</span>
                          </button>
                          <button 
                            onClick={() => { setShowDateFilterModal(true); setShowMobileMenu(false); }}
                            className="w-full text-left px-6 py-4 text-sm text-[#45464e] hover:bg-gray-50 flex items-center gap-4"
                          >
                            <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" />
                            </svg>
                            <span className="whitespace-nowrap text-base">Filter by Date</span>
                          </button>
                          <button 
                            onClick={() => { handleShare(); setShowMobileMenu(false); }}
                            className="w-full text-left px-6 py-4 text-sm text-[#45464e] hover:bg-gray-50 flex items-center gap-4"
                          >
                            <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" stroke="currentColor" />
                            </svg>
                            <span className="whitespace-nowrap text-base">Share Orders</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Bulk Action Dropdown */}
                  <div className="relative bulk-dropdown-container">
                    <button 
                      onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                      disabled={selectedOrders.length === 0}
                      className={`flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm transition-colors ${
                        selectedOrders.length === 0 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="hidden sm:inline">Bulk Action</span>
                      <span className="sm:hidden">Bulk</span>
                      <span className="text-[#02016a]">({selectedOrders.length})</span>
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" stroke="currentColor" />
                      </svg>
                    </button>
                    {showBulkDropdown && selectedOrders.length > 0 && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <div className="py-1">
                          <button 
                            onClick={() => { handleBulkAction('export'); setShowBulkDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                          >
                            Export Selected
                          </button>
                          <button 
                            onClick={() => { handleBulkAction('delete'); setShowBulkDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                          >
                            Delete Selected
                          </button>
                          <button 
                            onClick={() => { handleBulkAction('mark-completed'); setShowBulkDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                          >
                            Mark as Completed
                          </button>
                          <button 
                            onClick={() => { handleBulkAction('mark-pending'); setShowBulkDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                          >
                            Mark as Pending
                          </button>
                          <button 
                            onClick={() => { handleBulkAction('mark-in-progress'); setShowBulkDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                          >
                            Mark as In-Progress
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
                
                {/* Table Column Headers */}
                <div className="hidden md:grid grid-cols-8 gap-4 text-sm font-medium text-[#45464e]">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300" 
                    />
                  </div>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-[#02016a]"
                    onClick={() => handleSort("Customer Name")}
                  >
                    Customer Name
                    <svg className={`w-4 h-4 ${sortColumn === "Customer Name" ? "text-[#02016a]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" />
                    </svg>
                  </div>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-[#02016a]"
                    onClick={() => handleSort("Order Date")}
                  >
                    Order Date
                    <svg className={`w-4 h-4 ${sortColumn === "Order Date" ? "text-[#02016a]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" />
                    </svg>
                  </div>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-[#02016a]"
                    onClick={() => handleSort("Order Type")}
                  >
                    Order Type
                    <svg className={`w-4 h-4 ${sortColumn === "Order Type" ? "text-[#02016a]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" />
                    </svg>
                  </div>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-[#02016a]"
                    onClick={() => handleSort("Tracking ID")}
                  >
                    Tracking ID
                    <svg className={`w-4 h-4 ${sortColumn === "Tracking ID" ? "text-[#02016a]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" />
                    </svg>
                  </div>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-[#02016a]"
                    onClick={() => handleSort("Order Total")}
                  >
                    Order Total
                    <svg className={`w-4 h-4 ${sortColumn === "Order Total" ? "text-[#02016a]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1">
                    Action
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" />
                    </svg>
                  </div>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-[#02016a]"
                    onClick={() => handleSort("Status")}
                  >
                    Status
                    <svg className={`w-4 h-4 ${sortColumn === "Status" ? "text-[#02016a]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" />
                    </svg>
                  </div>
                </div>
                
                {/* Mobile Table Headers */}
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium text-[#45464e]">
                  <div className="flex items-center justify-between">
                    <span>Orders</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300" 
                      />
                      <span className="text-xs text-gray-500">Select All</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {/* Dynamic Data Rows */}
                {/* Desktop/Tablet Table Rows */}
                <div className="hidden md:block">
                  {currentOrders.map((order, index) => (
                    <div 
                      key={index} 
                      className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/view-order?id=${order.id}`)}
                    >
                      <div className="grid grid-cols-8 gap-4 text-sm text-[#45464e] items-center">
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={selectedOrders.includes(index)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectOrder(index);
                            }}
                            className="rounded border-gray-300" 
                          />
                        </div>
                        <div className="font-medium flex items-center gap-2 group">
                          <span>{order.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyToClipboard(order.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                            title="Copy customer name"
                          >
                            <svg className="w-3 h-3 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" />
                            </svg>
                          </button>
                        </div>
                        <div>{order.date}</div>
                        <div>{order.type}</div>
                        <div className="flex items-center gap-2 group">
                          <span>{order.tracking}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyToClipboard(order.tracking);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                            title="Copy tracking ID"
                          >
                            <svg className="w-3 h-3 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" />
                            </svg>
                          </button>
                        </div>
                        <div className="font-medium">{order.total}</div>
                        <div className="flex items-center gap-1">
                          <span>{order.action}</span>
                          <div className="relative action-dropdown-container">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionDropdown(showActionDropdown === index ? null : index);
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Change Status"
                            >
                              <svg 
                                className={`w-4 h-4 text-gray-700 transition-transform duration-200 ${
                                  showActionDropdown === index ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {showActionDropdown === index && (
                              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <div className="py-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(index, 'Completed');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                                  >
                                    Completed
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(index, 'In-Progress');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                                  >
                                    In-Progress
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(index, 'Pending');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                                  >
                                    Pending
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Mobile Table Rows */}
                <div className="md:hidden">
                  {currentOrders.map((order, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer"
                      onClick={() => router.push(`/view-order?id=${order.id}`)}
                    >
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={selectedOrders.includes(index)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectOrder(index);
                              }}
                              className="rounded border-gray-300" 
                            />
                            <div>
                              <div className="font-medium text-[#45464e]">{order.name}</div>
                              <div className="text-xs text-gray-500">{order.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
                              {order.status}
                            </span>
                            <div className="relative action-dropdown-container">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowActionDropdown(showActionDropdown === index ? null : index);
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Change Status"
                              >
                                <svg 
                                  className={`w-4 h-4 text-gray-700 transition-transform duration-200 ${
                                    showActionDropdown === index ? 'rotate-180' : ''
                                  }`} 
                                  fill="none" 
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {showActionDropdown === index && (
                                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <div className="py-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(index, 'Completed');
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                                    >
                                      Completed
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(index, 'In-Progress');
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                                    >
                                      In-Progress
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(index, 'Pending');
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-[#45464e] hover:bg-gray-50"
                                    >
                                      Pending
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Details Row */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 text-xs">Order Type</div>
                            <div className="font-medium">{order.type}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">Total</div>
                            <div className="font-medium">{order.total}</div>
                          </div>
                        </div>
                        
                        {/* Tracking Row */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-gray-500 text-xs">Tracking ID</div>
                            <div className="font-medium flex items-center gap-2">
                              <span>{order.tracking}</span>
                              <button
                                onClick={() => handleCopyToClipboard(order.tracking)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Copy tracking ID"
                              >
                                <svg className="w-3 h-3 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pagination */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#45464e]">{itemsPerPage}</span>
                      <span className="text-sm text-[#8b8d97]">Items per page</span>
                    </div>
                    <span className="text-sm text-[#8b8d97]">{startIndex + 1}-{Math.min(endIndex, sortedOrders.length)} of {sortedOrders.length} items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#8b8d97]">{currentPage}</span>
                    <span className="text-sm text-[#8b8d97]">of {totalPages} pages</span>
                    <div className="flex items-center gap-1 ml-4">
                      <button 
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg border border-gray-200 transition-colors ${
                          currentPage === 1 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" stroke="currentColor" />
                        </svg>
                      </button>
                      <button 
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg border border-gray-200 transition-colors ${
                          currentPage === totalPages 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" stroke="currentColor" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modals */}
            <FilterModal 
              isOpen={showFilterModal}
              onClose={() => setShowFilterModal(false)}
              onApply={handleFilterApply}
            />
            
            <FilterByDateModal 
              isOpen={showDateFilterModal}
              onClose={() => setShowDateFilterModal(false)}
              onApply={handleDateFilterApply}
            />
            
          </section>

          {/* Create Order Modal */}
          <CreateOrderModal 
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateOrder}
          />
        </div>
      </main>

    </div>
  );
}
