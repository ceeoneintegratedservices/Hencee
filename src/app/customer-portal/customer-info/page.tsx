"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useMemo } from "react";
import { getMyProfile, updateMyProfile, getMyOrders } from "@/services/customerPortal";
import type { CustomerProfile, CustomerOrder } from "@/types/customerPortal";

interface OrderHistoryItem {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount?: number;
  items: Array<{
    productName: string;
    quantity: number;
    totalPrice: number;
  }>;
}

export default function CustomerInfoPage() {
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch customer profile and orders on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch customer profile
        const profile = await getMyProfile();
        setCustomer(profile);

        // Fetch orders
        const ordersResponse = await getMyOrders({ limit: 50 });
        const ordersData = ordersResponse.data || [];
        
        // Transform API orders to local format
        const transformedOrders: OrderHistoryItem[] = ordersData.map((order: CustomerOrder) => ({
          id: order.id,
          createdAt: order.createdAt,
          status: order.status?.toLowerCase() || 'pending',
          paymentStatus: order.paymentStatus?.toLowerCase() || 'pending',
          totalAmount: order.totalAmount,
          paidAmount: order.paidAmount,
          items: order.items?.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          })) || [],
        }));
        
        setOrders(transformedOrders);
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError("Failed to load customer data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate outstanding balance
  const outstandingBalance = useMemo(() => {
    return orders
      .filter(order => {
        const paid = order.paidAmount || 0;
        return order.paymentStatus === "partial" || (order.paymentStatus === "pending" && paid > 0 && paid < order.totalAmount);
      })
      .reduce((sum, order) => {
        const paidAmount = order.paidAmount || 0;
        return sum + (order.totalAmount - paidAmount);
      }, 0);
  }, [orders]);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initials = customer?.name
    ? customer.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);
  };

  const handleSave = async () => {
    if (!customer) return;
    
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await updateMyProfile({
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        profileImageUrl: profileImage || customer.profileImageUrl,
      });
      
      setSuccessMessage("Customer details updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate last order date
  const lastOrderDate = useMemo(() => {
    if (orders.length === 0) return "No orders yet";
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastOrder = sortedOrders[0];
    const daysDiff = Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "Yesterday";
    return `${daysDiff} days ago`;
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02016a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#f4f5fa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Failed to load profile"}</p>
          <button
            onClick={() => router.push("/customer-portal")}
            className="mt-4 px-4 py-2 bg-[#02016a] text-white rounded-lg"
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      {/* Header */}
      <header className="bg-white flex items-center justify-between px-5 py-4 shadow-sm w-full border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/customer-portal")}
            className="mr-2 p-1 rounded-md hover:bg-[#f4f5fa] transition-colors"
            aria-label="Back to customer dashboard"
          >
            <svg
              className="w-5 h-5 text-[#45464e]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <Image
              src="/icons/logoIcon.png"
              alt="Ceeone Logo"
              width={100}
              height={100}
              className="w-20 h-20 object-contain"
            />
            <h1 className="text-[20px] font-medium text-[#45464e]">
              Customer Information
            </h1>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        </div>
      )}
      {error && (
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Profile card */}
          <section className="bg-white rounded-xl shadow-sm p-6 lg:p-8 flex flex-col items-center text-center">
            <button
              type="button"
              onClick={handleProfileClick}
              className="relative w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-full bg-[#02016a] flex items-center justify-center text-white text-2xl lg:text-3xl xl:text-4xl font-semibold mb-4 lg:mb-6 overflow-hidden hover:ring-2 hover:ring-[#02016a] hover:ring-offset-2 transition-all"
              aria-label="Add or change profile picture"
            >
              {profileImage || customer.profileImageUrl ? (
                <Image
                  src={profileImage || customer.profileImageUrl || ''}
                  alt="Customer profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
              <span className="absolute bottom-0 inset-x-0 bg-black/40 text-[10px] text-white py-0.5">
                Change
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
            <h2 className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900 mb-1 lg:mb-2">
              {customer.name}
            </h2>
            <p className="text-sm lg:text-base xl:text-lg text-gray-500 mb-4 lg:mb-6">Customer Profile</p>

            <div className="w-full border-t border-gray-100 pt-4 lg:pt-6 mt-2 space-y-2 lg:space-y-3 text-sm lg:text-base text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  customer.status?.toLowerCase() === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {customer.status || 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer Since</span>
                <span className="text-gray-900">{formatDate(customer.customerSince)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Orders</span>
                <span className="text-gray-900">{customer.stats?.totalOrders ?? orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Spent</span>
                <span className="text-gray-900">
                  ₦{(customer.stats?.totalSpent ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Outstanding Balance</span>
                <span className={outstandingBalance > 0 ? "text-orange-600 font-semibold" : "text-gray-900"}>
                  ₦{outstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          {/* Right: Details */}
          <section className="bg-white rounded-xl shadow-sm p-6 lg:p-8 lg:col-span-2 space-y-6 lg:space-y-8">
            <div>
              <h3 className="text-sm lg:text-base xl:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
                Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 text-sm lg:text-base">
                <div>
                  <p className="text-gray-500 mb-1 lg:mb-2">Email</p>
                  <input
                    type="email"
                    value={customer.email || ''}
                    onChange={(e) =>
                      setCustomer((prev) => prev ? ({
                        ...prev,
                        email: e.target.value,
                      }) : null)
                    }
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg text-sm lg:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1 lg:mb-2">Phone / WhatsApp</p>
                  <input
                    type="tel"
                    value={customer.phone || ''}
                    onChange={(e) =>
                      setCustomer((prev) => prev ? ({
                        ...prev,
                        phone: e.target.value,
                      }) : null)
                    }
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg text-sm lg:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 lg:pt-6">
              <h3 className="text-sm lg:text-base xl:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
                Address
              </h3>
              <textarea
                value={customer.address || ''}
                onChange={(e) =>
                  setCustomer((prev) => prev ? ({
                    ...prev,
                    address: e.target.value,
                  }) : null)
                }
                rows={3}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg text-sm lg:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#02016a] resize-none"
              />
            </div>

            <div className="border-t border-gray-100 pt-4 lg:pt-6">
              <h3 className="text-sm lg:text-base xl:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
                Recent Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 text-sm lg:text-base">
                <div className="bg-[#f4f5fa] rounded-lg p-3 lg:p-4">
                  <p className="text-xs lg:text-sm text-gray-500 mb-1 lg:mb-2">Last Order</p>
                  <p className="text-sm lg:text-base font-semibold text-gray-900">
                    {lastOrderDate}
                  </p>
                </div>
                <div 
                  className={`bg-[#f4f5fa] rounded-lg p-3 lg:p-4 ${outstandingBalance > 0 ? 'cursor-pointer hover:bg-orange-50 transition-colors' : ''}`}
                  onClick={() => {
                    if (outstandingBalance > 0) {
                      router.push('/customer-portal?tab=debt');
                    }
                  }}
                >
                  <p className="text-xs lg:text-sm text-gray-500 mb-1 lg:mb-2">Outstanding Balance</p>
                  <p className={`text-sm lg:text-base font-semibold ${outstandingBalance > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                    ₦{outstandingBalance.toLocaleString()}
                  </p>
                  {outstandingBalance > 0 && (
                    <p className="text-[10px] lg:text-xs text-orange-600 mt-1">Click to view details →</p>
                  )}
                </div>
                <div className="bg-[#f4f5fa] rounded-lg p-3 lg:p-4">
                  <p className="text-xs lg:text-sm text-gray-500 mb-1 lg:mb-2">Credit Limit</p>
                  <p className="text-sm lg:text-base font-semibold text-gray-900">
                    ₦{(customer.creditLimit ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#f4f5fa] rounded-lg p-3 lg:p-4">
                  <p className="text-xs lg:text-sm text-gray-500 mb-1 lg:mb-2">Balance</p>
                  <p className="text-sm lg:text-base font-semibold text-gray-900">
                    ₦{(customer.balance ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 lg:pt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 lg:px-6 py-2 lg:py-3 bg-[#02016a] text-white text-sm lg:text-base font-medium rounded-lg hover:bg-[#03024a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
