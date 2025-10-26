"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Breadcrumb from "../../components/Breadcrumb";
import TimePeriodSelector from "../../components/TimePeriodSelector";
import { 
  getDashboardOverview, 
  getDashboardActivities,
  getDashboardOrders,
  getDashboardSales,
  type DashboardOverview,
  type DashboardActivities,
  type DashboardOrders,
  type DashboardSales,
  type TimeFrame
} from "../../services/dashboard";
import { useNotifications } from "../../components/Notification";
import { usePermissions } from "../../hooks/usePermissions";

export default function AdminDashboard() {
  const router = useRouter();
  const { showError, showSuccess } = useNotifications();
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  // Client-side only state to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  
  // For dropdowns (e.g. This Week, Last 7 Days)
  const [summaryFilter] = useState("Sales");
  const [dateFilter] = useState("Last 7 Days");
  // Time period selection for cards
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<"This Week" | "This Month" | "All Time">("This Week");
  // Sidebar toggle for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // API data state
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [activities, setActivities] = useState<DashboardActivities | null>(null);
  const [ordersData, setOrdersData] = useState<DashboardOrders | null>(null);
  const [salesData, setSalesData] = useState<DashboardSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-side only mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      // Check if we have any form of authentication
      const hasAuth = token || userData;
      
      if (!hasAuth) {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }
    };

    // Small delay to ensure localStorage is available
    const timer = setTimeout(checkAuth, 100);
    
    // Also check again after a longer delay to catch any timing issues
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

  // Handle time period selection
  const handleTimePeriodChange = (period: "This Week" | "This Month" | "All Time") => {
    setSelectedTimePeriod(period);
  };

  // Convert time period to API timeframe
  const getTimeFrame = (period: "This Week" | "This Month" | "All Time"): TimeFrame => {
    switch (period) {
      case "This Week":
        return "thisWeek";
      case "This Month":
        return "thisMonth";
      case "All Time":
        return "allTime";
      default:
        return "thisWeek";
    }
  };

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const timeframe = getTimeFrame(selectedTimePeriod);
      const [overviewData, activitiesData, ordersData, salesData] = await Promise.all([
        getDashboardOverview(timeframe),
        getDashboardActivities(timeframe),
        getDashboardOrders(timeframe),
        getDashboardSales(timeframe)
      ]);
      
      setDashboardData(overviewData);
      setActivities(activitiesData);
      setOrdersData(ordersData);
      setSalesData(salesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      showError('Error', err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data when authenticated or time period changes
  // Only fetch data if user has permission to view dashboard
  useEffect(() => {
    if (isAuthenticated && hasPermission('dashboard.view')) {
      fetchDashboardData();
    }
  }, [isAuthenticated, selectedTimePeriod, hasPermission]);

  // Activity categories for display
  const activityCategories = {
    sale: 'Sales',
    order: 'Orders',
    inventory: 'Inventory', 
    customer: 'Customers',
    product: 'Products',
    user: 'Users'
  };

  // Client-side only rendering to prevent hydration issues
  if (!mounted) {
    return (
      <div className="flex w-full h-screen bg-[#f4f5fa] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication or fetching data
  if (!isAuthenticated || loading) {
    return (
      <div className="flex w-full h-screen bg-[#f4f5fa] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">
            {!isAuthenticated ? 'Checking authentication...' : 'Fetching dashboard data...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex w-full h-screen bg-[#f4f5fa] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-[#1C1D22] text-white rounded-lg hover:bg-[#2a2b32] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-[#f4f5fa] overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        currentPage="dashboard"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        {/* Click overlay to close sidebar when clicking on main content */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Header */}
        <Header title="Dashboard" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* Breadcrumbs */}
        <Breadcrumb items={[
          { label: "Dashboard" }
        ]} />
        
        <div className="px-5 pt-7">
          {/* Check if user has dashboard permissions */}
          {!hasPermission('dashboard.view') ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">🚫</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-600 mb-4">You don't have permission to view the dashboard.</p>
                <p className="text-gray-500">Contact your administrator for access.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-5">
                {/* Sales Card */}
                {hasAnyPermission(['sales.view', 'dashboard.view']) && (
                  <div 
                    className="bg-white rounded-xl p-4 shadow col-span-1 sm:col-span-1 lg:col-span-3 h-[145px]"
                    onClick={() => router.push('/orders')}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span>$</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <TimePeriodSelector
                          selectedTimePeriod={selectedTimePeriod}
                          onTimePeriodChange={handleTimePeriodChange}
                          textColor="#8b8d97"
                          iconColor="#8B8D97"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Sales</div>
                        <div className="text-xl font-medium">₦{(salesData?.sales?.value || 0).toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Volume</div>
                        <div className="text-xl font-medium">{salesData?.sales?.volume || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Customers Card */}
                {hasAnyPermission(['customers.view', 'dashboard.view']) && (
                  <div 
                    className="bg-white rounded-xl p-4 shadow col-span-1 sm:col-span-1 lg:col-span-3 h-[145px]"
                    onClick={() => router.push('/customers')}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                        <span>👥</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <TimePeriodSelector
                          selectedTimePeriod={selectedTimePeriod}
                          onTimePeriodChange={handleTimePeriodChange}
                          textColor="#8b8d97"
                          iconColor="#8B8D97"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Customers</div>
                        <div className="text-xl font-medium">{dashboardData?.customers?.allCustomers?.value || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Active</div>
                        <div className="text-xl font-medium">{dashboardData?.customers?.activeCustomers?.value || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Orders Card */}
                {hasAnyPermission(['sales.view', 'dashboard.view']) && (
                  <div 
                    className="bg-white rounded-xl p-4 shadow col-span-1 sm:col-span-2 lg:col-span-4 h-[145px]"
                    onClick={() => router.push('/orders')}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                        <span>📦</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <TimePeriodSelector
                          selectedTimePeriod={selectedTimePeriod}
                          onTimePeriodChange={handleTimePeriodChange}
                          textColor="#8b8d97"
                          iconColor="#8B8D97"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">All Orders</div>
                        <div className="text-xl font-medium">{ordersData?.allOrders?.value || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Pending</div>
                        <div className="text-xl font-medium">{ordersData?.pending?.value || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Completed</div>
                        <div className="text-xl font-medium">{ordersData?.completed?.value || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
              
              {/* Second row */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-5">
                {/* Additional cards would go here */}
                {hasAnyPermission(['reports.view', 'dashboard.view']) && (
                  <div className="bg-white rounded-xl p-4 shadow col-span-1 sm:col-span-1 lg:col-span-3 h-[145px]">
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span>📊</span>
                      </div>
                      <div>
                        <TimePeriodSelector
                          selectedTimePeriod={selectedTimePeriod}
                          onTimePeriodChange={handleTimePeriodChange}
                          textColor="#8b8d97"
                          iconColor="#8B8D97"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-center">
                        <div className="text-gray-500 text-sm">Total Profit</div>
                        <div className="text-xl font-medium">₦0</div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
              
              {/* Activity feed */}
              {hasAnyPermission(['dashboard.view', 'audit.view_logs']) && (
                <section className="bg-white rounded-xl p-4 shadow">
                  <h2 className="text-lg font-medium mb-4">Recent Activities</h2>
                  <div className="space-y-2">
                    {activities && activities.activities.length > 0 ? (
                      activities.activities.map((activity) => (
                        <div key={activity.id} className="bg-gray-50 p-3 rounded-lg">
                          <p>{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No recent activities</p>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}