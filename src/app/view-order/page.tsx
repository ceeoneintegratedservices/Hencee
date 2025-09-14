"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { OrderDataService, Order } from "@/services/OrderDataService";
import { NotificationContainer, useNotifications } from "@/components/Notification";

function ViewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const { notifications, removeNotification, showSuccess } = useNotifications();
  
  // Fallback: try to get orderId from window.location if searchParams fails
  const [fallbackOrderId, setFallbackOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!orderId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      setFallbackOrderId(id);
    }
  }, [orderId]);
  
  const finalOrderId = orderId || fallbackOrderId;
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [previousOrders, setPreviousOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showItemStatusDropdown, setShowItemStatusDropdown] = useState<number | null>(null);


  // Load order data using the service
  useEffect(() => {
    if (finalOrderId) {
      // Simulate API call
      setTimeout(() => {
        const orderData = OrderDataService.generateOrder(finalOrderId);
        const previousOrdersData = OrderDataService.generatePreviousOrders(orderData.customer.id, finalOrderId);
        
        setOrder(orderData);
        setPreviousOrders(previousOrdersData);
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [finalOrderId]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setShowStatusDropdown(false);
        setShowItemStatusDropdown(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-dropdown')) {
        setShowStatusDropdown(false);
      }
      if (!target.closest('.item-status-dropdown')) {
        setShowItemStatusDropdown(null);
      }
    };

    if (showStatusDropdown || showItemStatusDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusDropdown, showItemStatusDropdown]);

  const handleCopyTrackingId = () => {
    if (order) {
      navigator.clipboard.writeText(order.trackingId);
    }
  };

  const handleItemStatusChange = (itemIndex: number, newStatus: string) => {
    if (order) {
      // Update the specific item status
      const updatedOrder = { ...order };
      updatedOrder.items[itemIndex] = {
        ...updatedOrder.items[itemIndex],
        status: newStatus as any
      };
      setOrder(updatedOrder);
      
      // Persist the item status change to localStorage
      const itemStatusChanges = JSON.parse(localStorage.getItem('itemStatusChanges') || '{}');
      const itemKey = `${order.id}-item-${itemIndex}`;
      itemStatusChanges[itemKey] = newStatus;
      localStorage.setItem('itemStatusChanges', JSON.stringify(itemStatusChanges));
      
      // Show success notification
      showSuccess(
        "Item Status Updated",
        `${updatedOrder.items[itemIndex].productName} status changed to ${newStatus}!`
      );
      
      // Close dropdown
      setShowItemStatusDropdown(null);
      
      // In a real app, you would make an API call to update the item status
      console.log("Item status updated:", itemKey, "to", newStatus);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (order) {
      // Update the order status
      const updatedOrder = { ...order, status: newStatus as any };
      setOrder(updatedOrder);
      
      // Persist the status change to localStorage
      const statusChanges = JSON.parse(localStorage.getItem('orderStatusChanges') || '{}');
      statusChanges[order.id] = newStatus;
      localStorage.setItem('orderStatusChanges', JSON.stringify(statusChanges));
      
      // Show success notification
      showSuccess(
        "Status Updated",
        `Order status changed to ${newStatus} successfully!`
      );
      
      // Close dropdown
      setShowStatusDropdown(false);
      
      // In a real app, you would make an API call to update the order status
      console.log("Order status updated:", order.id, "to", newStatus);
    }
  };

  const handleMarkAsComplete = () => {
    handleStatusChange("Completed");
  };

  const handleCancelOrder = () => {
    if (order) {
      // Confirm cancellation
      const confirmed = window.confirm("Are you sure you want to cancel this order? This action cannot be undone.");
      
      if (confirmed) {
        handleStatusChange("Cancelled");
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return OrderDataService.formatCurrency(amount);
  };

  const getTireBrandImage = (productName: string) => {
    const brandImages: Record<string, string> = {
      "Michelin": "/images/michelin.png",
      "Bridgestone": "/images/Bridgestone.png", 
      "Continental": "/images/continental.png",
      "Goodyear": "/images/goodyear.png",
      "Dunlop": "/images/dunlop.png",
      "Pirelli": "/images/pirelli.png",
      "Hankook": "/images/hankook.png",
      "Maxxis": "/images/maxxis.png",
      "Firestone": "/images/firestone.png",
      "Yokohama": "/images/yokohama.png"
    };
    
    // Extract brand name from product name
    const brand = Object.keys(brandImages).find(brand => 
      productName.toLowerCase().includes(brand.toLowerCase())
    );
    
    return brand ? brandImages[brand] : "/images/michelin.png"; // Default to Michelin
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02016a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/orders")}
            className="bg-[#02016a] text-white px-6 py-2 rounded-lg hover:bg-[#02016a]/90 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      {/* Notifications */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Sidebar */}
      <Sidebar currentPage="orders" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Header title="Orders" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <div className="p-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>/</span>
            <span>Orders</span>
            <span>/</span>
            <span className="text-[#02016a] font-medium">View Order</span>
          </div>

          {/* Order Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-gray-900">Order Number {order.orderNumber}</h1>
                <p className="text-gray-600">Order Date {order.orderDate}</p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Tracking ID {order.trackingId}</span>
                  <button
                    onClick={handleCopyTrackingId}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                    order.status === "Completed" 
                      ? "bg-green-100 text-green-800"
                      : order.status === "In-Progress"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "Pending"
                      ? "bg-orange-100 text-orange-800"
                      : order.status === "Cancelled"
                      ? "bg-red-100 text-red-800"
                      : order.status === "Processing"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "Shipped"
                      ? "bg-purple-100 text-purple-800"
                      : order.status === "Delivered"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Status Dropdown */}
                <div className="relative status-dropdown">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    Change Status
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showStatusDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleStatusChange("Pending")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          Pending
                        </button>
                        <button
                          onClick={() => handleStatusChange("In-Progress")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          In-Progress
                        </button>
                        <button
                          onClick={() => handleStatusChange("Completed")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Completed
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => handleCancelOrder()}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {order.status !== "Completed" && order.status !== "Cancelled" && (
                  <button
                    onClick={handleMarkAsComplete}
                    className="bg-[#02016a] text-white px-6 py-2 rounded-lg hover:bg-[#02016a]/90 transition-colors flex items-center gap-2"
                  >
                    Mark as Complete
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                {(order.status === "Completed" || order.status === "Cancelled") && (
                  <div className="text-sm text-gray-500 italic">
                    {order.status === "Completed" ? "Order completed" : "Order cancelled"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Customer Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{order.customer.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.customer.status === "Pending" 
                        ? "bg-orange-100 text-orange-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {order.customer.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Customer since {order.customer.customerSince}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm text-gray-900">{order.customer.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm text-gray-900 break-all">{order.customer.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Addresses</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Home Address</p>
                      <p className="text-sm text-gray-900">{order.homeAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Billing Address</p>
                      <p className="text-sm text-gray-900">{order.billingAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Order Type Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment & Order Type</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                      <p className="text-sm text-gray-900">{order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Order Type</p>
                      <p className="text-sm text-gray-900">{order.orderType}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Order Details {order.items.length}</h2>
            </div>

            {/* Controls Bar */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    Filter
                  </button>
                  
                  <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Filter
                  </button>
                  
                  <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </button>
                  
                  <div className="relative">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Bulk Action
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                      <svg className="inline w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                      <svg className="inline w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                      <svg className="inline w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                      <svg className="inline w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Total
                      <svg className="inline w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                      <svg className="inline w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                      <svg className="inline w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                            <img 
                              src={getTireBrandImage(item.productName)} 
                              alt={item.productName}
                              className="w-10 h-10 object-contain"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.style.display = 'none';
                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextElement) {
                                  nextElement.style.display = 'block';
                                }
                              }}
                            />
                            <svg 
                              className="w-6 h-6 text-gray-400 hidden" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.productName.split(' ')[0]} Brand
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.discount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.orderTotal)}</td>
                      <td className="px-6 py-4">
                        <div className="relative item-status-dropdown">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowItemStatusDropdown(showItemStatusDropdown === index ? null : index);
                            }}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                          >
                            Change Status
                            <svg 
                              className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${
                                showItemStatusDropdown === index ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {showItemStatusDropdown === index && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <div className="py-1">
                                <button 
                                  onClick={() => handleItemStatusChange(index, 'In-Progress')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  In-Progress
                                </button>
                                <button 
                                  onClick={() => handleItemStatusChange(index, 'Completed')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  Completed
                                </button>
                                <button 
                                  onClick={() => handleItemStatusChange(index, 'Defective')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                  Defective
                                </button>
                                <button 
                                  onClick={() => handleItemStatusChange(index, 'Canceled')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                  Canceled
                                </button>
                                <button 
                                  onClick={() => handleItemStatusChange(index, 'Returned')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                  Returned
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          item.status === "In-Progress"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Defective"
                            ? "bg-red-100 text-red-800"
                            : item.status === "Canceled"
                            ? "bg-red-100 text-red-800"
                            : item.status === "Returned"
                            ? "bg-yellow-100 text-yellow-800"
                            : item.status === "Cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-end">
                <div className="text-lg font-semibold text-gray-900">
                  Total {formatCurrency(order.totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Previous Orders Section */}
          {previousOrders.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Previous Orders by {order.customer.name}</h2>
                <p className="text-sm text-gray-600 mt-1">Order history for this customer</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previousOrders.map((prevOrder) => (
                      <tr key={prevOrder.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{prevOrder.orderNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{prevOrder.orderDate}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{prevOrder.items.length} item(s)</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(prevOrder.totalAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            prevOrder.status === "Delivered" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {prevOrder.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => router.push(`/view-order?id=${prevOrder.id}`)}
                            className="text-[#02016a] hover:text-[#02016a]/80 text-sm font-medium transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ViewOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02016a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    }>
      <ViewOrderContent />
    </Suspense>
  );
}
