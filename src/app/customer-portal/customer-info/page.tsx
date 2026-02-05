"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";

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

  const [customer, setCustomer] = useState({
    name: "Kevin Mezie",
    email: "kevin.mezie@example.com",
    phone: "+234 800 123 4567", // can be WhatsApp number too
    customerSince: "March 12, 2023",
    totalOrders: 14,
    totalSpent: 1250000,
    address: "15 Adekunle Street, Yaba, Lagos State",
    status: "Active",
    preferredChannel: "Phone & WhatsApp",
    mostPurchasedItem: "Bridgestone 16\" Tire",
  });

  // Mock orders data (same as customer portal for consistency)
  const orders: OrderHistoryItem[] = [
    {
      id: "order-001234",
      createdAt: new Date().toISOString(),
      status: "completed",
      paymentStatus: "completed",
      totalAmount: 250000,
      items: [
        { productName: "Bridgestone 16\" Tire", quantity: 2, totalPrice: 150000 },
        { productName: "Michelin 18\" Tire", quantity: 1, totalPrice: 100000 },
      ],
    },
    {
      id: "order-001235",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      paymentStatus: "partial",
      totalAmount: 120000,
      paidAmount: 50000,
      items: [{ productName: "Goodyear 17\" Tire", quantity: 2, totalPrice: 120000 }],
    },
    {
      id: "order-001237",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      paymentStatus: "partial",
      totalAmount: 80000,
      paidAmount: 30000,
      items: [{ productName: "Maxxis 15\" Tire", quantity: 1, totalPrice: 80000 }],
    },
    {
      id: "order-001240",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      paymentStatus: "partial",
      totalAmount: 150000,
      paidAmount: 75000,
      items: [
        { productName: "Dunlop 16\" Tire", quantity: 2, totalPrice: 150000 },
      ],
    },
  ];

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
  }, []);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

  const handleSave = () => {
    alert("Customer details updated successfully.");
  };

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
              alt="Ceeone Wheels Logo"
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
              {profileImage ? (
                <Image
                  src={profileImage}
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {customer.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer Since</span>
                <span className="text-gray-900">{customer.customerSince}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Orders</span>
                <span className="text-gray-900">{customer.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Spent</span>
                <span className="text-gray-900">
                  ₦{customer.totalSpent.toLocaleString()}
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
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg text-sm lg:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1 lg:mb-2">Phone / WhatsApp</p>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
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
                value={customer.address}
                onChange={(e) =>
                  setCustomer((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
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
                    2 days ago
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
                  <p className="text-xs lg:text-sm text-gray-500 mb-1 lg:mb-2">Preferred Channel</p>
                  <p className="text-sm lg:text-base font-semibold text-gray-900">
                    {customer.preferredChannel}
                  </p>
                </div>
                <div className="bg-[#f4f5fa] rounded-lg p-3 lg:p-4">
                  <p className="text-xs lg:text-sm text-gray-500 mb-1 lg:mb-2">Most Purchased Item</p>
                  <p className="text-sm lg:text-base font-semibold text-gray-900">
                    {customer.mostPurchasedItem}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 lg:pt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="px-5 lg:px-6 py-2 lg:py-3 bg-[#02016a] text-white text-sm lg:text-base font-medium rounded-lg hover:bg-[#03024a] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


