"use client";

import { useState, useEffect } from "react";

import { CreateSalePayload } from "@/services/sales";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (orderData: CreateSalePayload) => void;
}

interface OrderData {
  customer: string;
  customerId?: string;
  paymentType: string;
  orderType: string;
  orderDate: string;
  orderTime: string;
  orderStatus: string;
  orderNote: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isFavorite: boolean;
  totalOrders: number;
  lastOrderDate: string;
}

export default function CreateOrderModal({ isOpen, onClose, onCreate }: CreateOrderModalProps) {
  const [orderData, setOrderData] = useState<OrderData>({
    customer: "",
    paymentType: "",
    orderType: "",
    orderDate: "12/12/2020",
    orderTime: "12:00 PM",
    orderStatus: "Pending",
    orderNote: "",
    items: []
  });

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductList, setShowProductList] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [explicitCustomerId, setExplicitCustomerId] = useState<string>("");

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-dropdown') && !target.closest('.customer-input')) {
        setShowCustomerList(false);
      }
    };

    if (showCustomerList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCustomerList]);

  // Sample product data
  const products: Product[] = [
    { id: "1", name: "Michelin Pilot Sport 4", price: 25000, category: "Tires", stock: 15 },
    { id: "2", name: "Bridgestone Potenza RE-71R", price: 22000, category: "Tires", stock: 8 },
    { id: "3", name: "Continental ContiSportContact 5", price: 28000, category: "Tires", stock: 12 },
    { id: "4", name: "Pirelli P Zero", price: 30000, category: "Tires", stock: 6 },
    { id: "5", name: "Goodyear Eagle F1", price: 24000, category: "Tires", stock: 10 },
    { id: "6", name: "Dunlop Sport Maxx RT", price: 21000, category: "Tires", stock: 14 },
    { id: "7", name: "Hankook Ventus V12 evo2", price: 19000, category: "Tires", stock: 20 },
    { id: "8", name: "Yokohama Advan Sport V105", price: 26000, category: "Tires", stock: 7 },
    { id: "9", name: "Maxxis Victra Sport 5", price: 18000, category: "Tires", stock: 18 },
    { id: "10", name: "Firestone Firehawk Indy 500", price: 20000, category: "Tires", stock: 9 }
  ];

  // Sample customer data
  const customers: Customer[] = [
    { id: "1", name: "Janet Adebayo", email: "janet@example.com", phone: "+234 801 234 5678", isFavorite: true, totalOrders: 15, lastOrderDate: "2024-01-10" },
    { id: "2", name: "Samuel Johnson", email: "samuel@example.com", phone: "+234 802 345 6789", isFavorite: true, totalOrders: 8, lastOrderDate: "2024-01-08" },
    { id: "3", name: "Francis Doe", email: "francis@example.com", phone: "+234 803 456 7890", isFavorite: false, totalOrders: 3, lastOrderDate: "2024-01-05" },
    { id: "4", name: "Christian Dior", email: "christian@example.com", phone: "+234 804 567 8901", isFavorite: true, totalOrders: 12, lastOrderDate: "2024-01-12" },
    { id: "5", name: "Mary Okafor", email: "mary@example.com", phone: "+234 805 678 9012", isFavorite: false, totalOrders: 5, lastOrderDate: "2024-01-03" },
    { id: "6", name: "David Okonkwo", email: "david@example.com", phone: "+234 806 789 0123", isFavorite: true, totalOrders: 20, lastOrderDate: "2024-01-14" },
    { id: "7", name: "Grace Adebisi", email: "grace@example.com", phone: "+234 807 890 1234", isFavorite: false, totalOrders: 2, lastOrderDate: "2024-01-01" },
    { id: "8", name: "Michael Ogun", email: "michael@example.com", phone: "+234 808 901 2345", isFavorite: true, totalOrders: 18, lastOrderDate: "2024-01-13" }
  ];

  // Handle product search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowProductList(true);
    } else {
      setFilteredProducts([]);
      setShowProductList(false);
    }
  }, [searchQuery]);

  // Handle customer search
  useEffect(() => {
    if (customerSearchQuery.trim()) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.phone.includes(customerSearchQuery)
      );
      // Sort favorites first, then by name
      const sortedFiltered = filtered.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
      });
      setFilteredCustomers(sortedFiltered);
      setShowCustomerList(true);
    } else {
      // Show favorites first when no search query
      const favorites = customers.filter(customer => customer.isFavorite);
      const others = customers.filter(customer => !customer.isFavorite);
      setFilteredCustomers([...favorites, ...others]);
      setShowCustomerList(true);
    }
  }, [customerSearchQuery]);

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setOrderData(prev => ({ ...prev, customer: customer.name, customerId: customer.id }));
    setCustomerSearchQuery(customer.name);
    setShowCustomerList(false);
  };

  // Add product to order
  const addProductToOrder = (product: Product) => {
    const existingItem = orderData.items.find(item => item.id === product.id);
    
    if (existingItem) {
      // Update quantity if product already exists
      const updatedItems = orderData.items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      );
      setOrderData(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new product to order
      const newItem: OrderItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      };
      setOrderData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }
    
    // Clear search and hide product list
    setSearchQuery("");
    setShowProductList(false);
  };

  // Update product quantity
  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProductFromOrder(productId);
      return;
    }

    const updatedItems = orderData.items.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    );
    setOrderData(prev => ({ ...prev, items: updatedItems }));
  };

  // Remove product from order
  const removeProductFromOrder = (productId: string) => {
    const updatedItems = orderData.items.filter(item => item.id !== productId);
    setOrderData(prev => ({ ...prev, items: updatedItems }));
  };

  // Calculate total order amount
  const calculateTotal = () => {
    return orderData.items.reduce((total, item) => total + item.total, 0);
  };

  const handleCreate = () => {
    // Map our UI state to the API payload format
    const apiPayload = {
      customerId: orderData.customerId || "",
      items: orderData.items.map(item => ({
        productId: item.id,
        quantity: item.quantity
      })),
      paymentMethod: mapPaymentTypeToEnum(orderData.paymentType),
      orderType: orderData.orderType,
      status: mapOrderStatusToEnum(orderData.orderStatus),
      notes: orderData.orderNote
    };
    
    onCreate(apiPayload);
    onClose();
  };
  
  // Helper function to map UI payment types to API enum values
  const mapPaymentTypeToEnum = (paymentType: string): "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_MONEY" => {
    switch (paymentType) {
      case "Cash": return "CASH";
      case "Card": return "CARD";
      case "Bank Transfer": return "BANK_TRANSFER";
      case "Mobile Money": return "MOBILE_MONEY";
      default: return "CASH"; // Default to cash
    }
  };
  
  // Helper function to map UI order status to API enum values
  const mapOrderStatusToEnum = (status: string): "PENDING" | "COMPLETED" | "CANCELLED" => {
    switch (status) {
      case "Pending": return "PENDING";
      case "Completed": return "COMPLETED";
      case "Canceled": return "CANCELLED";
      default: return "PENDING"; // Default to pending
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 flex items-start justify-center z-50 pt-20 px-4" onClick={handleOverlayClick}>
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[600px] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-[20px] font-semibold text-[#45464e]">Create New Order</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* Left Section - Order Details */}
          <div className="flex-1 p-6 border-r border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-medium text-[#45464e]">Order Details</h3>
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-[#45464e]">New Customer</span>
                <button
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isNewCustomer ? 'bg-[#02016a]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isNewCustomer ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Customer Selection */}
              {!isNewCustomer ? (
                <div className="relative">
                <label className="block text-[14px] text-[#45464e] mb-2">Select Customer</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setOrderData(prev => ({ ...prev, customer: e.target.value }));
                      }}
                      onFocus={() => setShowCustomerList(true)}
                      placeholder="Search customers..."
                      className="customer-input w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                    />
                    <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  {/* Customer Dropdown */}
                  {showCustomerList && (
                    <div className="customer-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => selectCustomer(customer)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                                  {customer.isFavorite && (
                                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{customer.email}</p>
                                <p className="text-xs text-gray-500">{customer.phone}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-400">{customer.totalOrders} orders</span>
                                  <span className="text-xs text-gray-400">Last: {customer.lastOrderDate}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No customers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* New Customer Form Fields */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">First Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter first name"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">Last Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter last name"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[14px] text-[#45464e] mb-2">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[14px] text-[#45464e] mb-2">Phone Number</label>
                    <div className="flex gap-3">
                      <div className="relative">
                        <select className="block w-24 pl-3 pr-8 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent appearance-none">
                          <option value="+234">🇳🇬 +234</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
              </div>
                  
                  <div>
                    <label className="block text-[14px] text-[#45464e] mb-2">Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter address"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Type & Order Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] text-[#45464e] mb-2">Payment Type</label>
                  <select
                    value={orderData.paymentType}
                    onChange={(e) => setOrderData(prev => ({ ...prev, paymentType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                  >
                    <option value="">Payment Type</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] text-[#45464e] mb-2">Order Type</label>
                  <select
                    value={orderData.orderType}
                    onChange={(e) => setOrderData(prev => ({ ...prev, orderType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                  >
                    <option value="">Order Type</option>
                    <option value="Home Delivery">Home Delivery</option>
                    <option value="Pick Up">Pick Up</option>
                  </select>
                </div>
              </div>

              {/* Order Time & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] text-[#45464e] mb-2">Order Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={orderData.orderDate}
                      onChange={(e) => setOrderData(prev => ({ ...prev, orderDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent pl-10"
                      placeholder="Select date or type"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-[14px] text-[#45464e] mb-2">Order Time</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderData.orderTime}
                      onChange={(e) => setOrderData(prev => ({ ...prev, orderTime: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent pl-10"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-[14px] text-[#45464e] mb-2">Order Status</label>
                <select
                  value={orderData.orderStatus}
                  onChange={(e) => setOrderData(prev => ({ ...prev, orderStatus: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>

              {/* Order Note */}
              <div>
                <label className="block text-[14px] text-[#45464e] mb-2">Order Note</label>
                <textarea
                  value={orderData.orderNote}
                  onChange={(e) => setOrderData(prev => ({ ...prev, orderNote: e.target.value }))}
                  placeholder="Order Note"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Section - Items */}
          <div className="flex-1 p-6">
            <h3 className="text-[16px] font-medium text-[#45464e] mb-4">Items</h3>
            
            {/* Search Product */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search product name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent pl-10"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              {/* Product Search Results */}
              {showProductList && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addProductToOrder(product)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-[14px] font-medium text-[#45464e]">{product.name}</h4>
                          <p className="text-[12px] text-[#8b8d97]">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-medium text-[#45464e]">₦{product.price.toLocaleString()}</p>
                          <p className="text-[12px] text-[#8b8d97]">Stock: {product.stock}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results */}
              {showProductList && filteredProducts.length === 0 && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                  <p className="text-[14px] text-[#8b8d97] text-center">No products found</p>
                </div>
              )}
            </div>

            {/* Selected Products */}
            {orderData.items.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-medium text-[#45464e]">Selected Products</h4>
                  <span className="text-[12px] text-[#8b8d97]">{orderData.items.length} item(s)</span>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {orderData.items.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="text-[14px] font-medium text-[#45464e] mb-1">{item.name}</h5>
                          <p className="text-[12px] text-[#8b8d97]">₦{item.price.toLocaleString()} each</p>
                        </div>
                        <button
                          onClick={() => removeProductFromOrder(item.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateProductQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-12 text-center text-[14px] font-medium text-[#45464e]">{item.quantity}</span>
                          <button
                            onClick={() => updateProductQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-semibold text-[#45464e]">₦{item.total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[16px] font-semibold text-[#45464e]">Total</span>
                    <span className="text-[18px] font-bold text-[#02016a]">₦{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State for Products */
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-[120px] h-[120px] rounded-full bg-[#f4f5fa] flex items-center justify-center mb-6">
                  <div className="w-[50px] h-[50px] flex items-center justify-center">
                    <svg className="w-full h-full" fill="none" viewBox="0 0 18 20">
                      <path d="M14.0865 5C15.3503 5 16.6767 5.90969 17.1451 8.12012L17.9137 14.3145C18.4793 18.3533 16.2078 20 13.1588 20H4.86873C1.81092 20 -0.531257 18.8626 0.105058 14.3145L0.883378 8.12012C1.28109 5.84602 2.65071 5 3.93221 5H14.0865ZM6.09725 8.3291C5.60921 8.32918 5.21346 8.73693 5.21346 9.23926C5.21363 9.74144 5.60932 10.1484 6.09725 10.1484C6.58524 10.1484 6.98086 9.74149 6.98103 9.23926C6.98103 8.73688 6.58535 8.3291 6.09725 8.3291ZM11.8863 8.3291C11.3982 8.3291 11.0025 8.73688 11.0025 9.23926C11.0027 9.74149 11.3983 10.1484 11.8863 10.1484C12.3743 10.1484 12.7699 9.74146 12.7701 9.23926C12.7701 8.73691 12.3744 8.32915 11.8863 8.3291Z" fill="#130F26"/>
                      <path d="M13.9743 4.77432C13.9774 4.85189 13.9625 4.92913 13.9307 5H12.4936C12.4658 4.92794 12.451 4.85153 12.4501 4.77432C12.4501 2.85682 10.8903 1.30238 8.96615 1.30238C7.04204 1.30238 5.48224 2.85682 5.48224 4.77432C5.49542 4.84898 5.49542 4.92535 5.48224 5H4.01029C3.9971 4.92535 3.9971 4.84898 4.01029 4.77432C4.12212 2.10591 6.32539 0 9.00534 0C11.6853 0 13.8886 2.10591 14.0004 4.77432H13.9743Z" fill="#130F26" opacity="0.4"/>
                    </svg>
                  </div>
                </div>
                <span className="font-medium text-[16px] text-[#45464e] mb-2">Add Products to Your Order</span>
                <span className="text-[14px] text-[#8b8d97] text-center">Search and add products to this order.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#02016a] text-[#02016a] rounded-lg font-medium text-[14px] hover:bg-[#f4f5fa] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-[#02016a] text-white rounded-lg font-medium text-[14px] hover:bg-[#03024a] transition-colors"
          >
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}
