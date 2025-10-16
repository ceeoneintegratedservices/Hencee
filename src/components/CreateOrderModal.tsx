"use client";

import { useState, useEffect } from "react";

import { CreateSalePayload } from "@/services/sales";
import { listCustomers, createCustomer } from "@/services/customers";
import { listProducts } from "@/services/products";
import { CreateCustomerBody } from "@/types/customers";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (orderData: OrderData) => void;
}

interface OrderData {
  customer: string;
  paymentType: string;
  payment: string;
  paymentAmount: string;
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
  warehouseNumber?: string;
}

interface Product {
  id: string;
  name: string;
  price?: number;
  sellingPrice?: number;
  category?: string;
  stock?: number;
  quantity?: number;
  description?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isFavorite?: boolean;
  totalOrders?: number;
  lastOrderDate?: string;
  address?: string;
  status?: string;
}

export default function CreateOrderModal({ isOpen, onClose, onCreate }: CreateOrderModalProps) {
  const [orderData, setOrderData] = useState<OrderData>({
    customer: "",
    paymentType: "",
    payment: "",
    paymentAmount: "",
    orderDate: "12/12/2020",
    orderTime: "12:00 PM",
    orderStatus: "Pending",
    orderNote: "",
    items: []
  });

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductList, setShowProductList] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [explicitCustomerId, setExplicitCustomerId] = useState<string>("");
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // New customer form state
  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+234',
    address: ''
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

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

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      if (!isOpen) return;
      
      setProductsLoading(true);
      setProductsError(null);
      
      try {
        const data = await listProducts({ limit: 100 });
        // Handle both array response and { data: [] } response formats
        const productsArray = Array.isArray(data) ? data : (data.data || []);
        
        // Debug: Log the actual structure of the API response
        if (process.env.NODE_ENV === 'development') {
        }
        
        // Map API response to expected structure
        const mappedProducts = productsArray.map((product: any) => ({
          id: String(product.id || ''),
          name: String(product.name || 'Unknown Product'),
          price: Number(product.price || product.sellingPrice || 0),
          sellingPrice: Number(product.sellingPrice || product.price || 0),
          category: String(product.category || product.category?.name || 'General'),
          stock: Number(product.stock || product.quantity || 0),
          quantity: Number(product.quantity || product.stock || 0),
          description: String(product.description || ''),
        }));
        
        setProducts(mappedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProductsError("Failed to load products");
        // Fallback to empty array
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [isOpen]);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!isOpen) return;
      
      setCustomersLoading(true);
      setCustomersError(null);
      
      try {
        const data = await listCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomersError("Failed to load customers");
        // Fallback to empty array
        setCustomers([]);
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, [isOpen]);

  // Handle product search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(product => {
        // Ensure product has the expected structure
        if (!product || typeof product !== 'object') return false;
        if (!product.name || typeof product.name !== 'string') return false;
        
        return product.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredProducts(filtered);
      setShowProductList(true);
    } else {
      setFilteredProducts([]);
      setShowProductList(false);
    }
  }, [searchQuery, products]);

  // Handle customer search
  useEffect(() => {
    if (customerSearchQuery.trim()) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase())) ||
        (customer.phone && customer.phone.includes(customerSearchQuery))
      );
      // Sort by name since we don't have favorites from API
      const sortedFiltered = filtered.sort((a, b) => a.name.localeCompare(b.name));
      setFilteredCustomers(sortedFiltered);
      setShowCustomerList(true);
    } else {
      // Show all customers when no search query
      setFilteredCustomers(customers);
      setShowCustomerList(true);
    }
  }, [customerSearchQuery, customers]);

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setOrderData(prev => ({ ...prev, customer: customer.name }));
    setCustomerSearchQuery(customer.name);
    setShowCustomerList(false);
  };

  // Print invoice
  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceContent = generateInvoiceHTML();
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate invoice HTML for printing
  const generateInvoiceHTML = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .invoice-header { text-align: center; margin-bottom: 30px; }
          .invoice-title { font-size: 28px; font-weight: bold; color: #02016a; margin-bottom: 10px; }
          .invoice-number { font-size: 16px; color: #666; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .company-info, .customer-info { flex: 1; }
          .company-info h3, .customer-info h3 { margin: 0 0 10px 0; color: #333; }
          .company-info p, .customer-info p { margin: 5px 0; color: #666; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .items-table th { background-color: #f8f9fa; font-weight: bold; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-amount { font-size: 20px; font-weight: bold; color: #02016a; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">Invoice #${invoiceNumber}</div>
        </div>
        
        <div class="invoice-details">
          <div class="company-info">
            <h3>Ceeone Wheels</h3>
            <p>123 Business Street</p>
            <p>Lagos, Nigeria</p>
            <p>Phone: +234 800 123 4567</p>
            <p>Email: info@ceeonewheels.com</p>
          </div>
          <div class="customer-info">
            <h3>Bill To:</h3>
            <p><strong>${orderData.customer || 'Customer Name'}</strong></p>
            <p>Date: ${orderData.orderDate}</p>
            <p>Time: ${orderData.orderTime}</p>
            <p>Payment Type: ${orderData.paymentType}</p>
            <p>Payment Method: ${orderData.payment}${orderData.payment === 'Part Payment' && orderData.paymentAmount ? ` (₦${parseFloat(orderData.paymentAmount).toLocaleString()})` : ''}</p>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Warehouse</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.warehouseNumber || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>₦${item.price.toLocaleString()}</td>
                <td>₦${item.total.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-amount">Total: ₦${calculateTotal().toLocaleString()}</div>
        </div>
        
        ${orderData.orderNote ? `
          <div style="margin-top: 30px;">
            <h3>Notes:</h3>
            <p>${orderData.orderNote}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${currentDate} at ${currentTime}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Add product to order
  const addProductToOrder = (product: Product) => {
    const existingItem = orderData.items.find(item => item.id === product.id);
    const productPrice = product.sellingPrice || product.price || 0;
    
    if (existingItem) {
      // Update quantity if product already exists
      const updatedItems = orderData.items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * productPrice }
          : item
      );
      setOrderData(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new product to order
      const newItem: OrderItem = {
        id: product.id,
        name: product.name,
        price: productPrice,
        quantity: 1,
        total: productPrice
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

  // Create new customer function
  const createNewCustomer = async (): Promise<string> => {
    if (!newCustomerData.firstName || !newCustomerData.lastName || !newCustomerData.email || !newCustomerData.phone || !newCustomerData.address) {
      throw new Error('Please fill in all required customer fields');
    }

    const customerPayload: CreateCustomerBody = {
      name: `${newCustomerData.firstName} ${newCustomerData.lastName}`,
      email: newCustomerData.email,
      phone: `${newCustomerData.countryCode}${newCustomerData.phone}`,
      address: newCustomerData.address
    };

    const newCustomer = await createCustomer(customerPayload);
    return newCustomer.id;
  };

  const handleCreate = async () => {
    try {
      let customerId = explicitCustomerId;

      // If creating a new customer, create them first
      if (isNewCustomer) {
        setCreatingCustomer(true);
        customerId = await createNewCustomer();
      }

      // Update order data with customer ID
      const orderDataWithCustomer = {
        ...orderData,
        customerId: customerId
      };

      onCreate(orderDataWithCustomer);
      onClose();
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(error.message || 'Failed to create order');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invoice Preview Modal */}
      {showInvoicePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Invoice Preview Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Invoice Preview</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={printInvoice}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Invoice
                </button>
                <button
                  onClick={() => setShowInvoicePreview(false)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Invoice Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                {/* Invoice Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-[#02016a] mb-2">INVOICE</h1>
                  <p className="text-gray-600">Invoice #{`INV-${Date.now().toString().slice(-6)}`}</p>
                </div>
                
                {/* Company and Customer Info */}
                <div className="flex justify-between mb-8">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Ceeone Wheels</h3>
                    <p className="text-gray-600">123 Business Street</p>
                    <p className="text-gray-600">Lagos, Nigeria</p>
                    <p className="text-gray-600">Phone: +234 800 123 4567</p>
                    <p className="text-gray-600">Email: info@ceeonewheels.com</p>
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                    <p className="text-gray-600 font-medium">{orderData.customer || 'Customer Name'}</p>
                    <p className="text-gray-600">Date: {orderData.orderDate}</p>
                    <p className="text-gray-600">Time: {orderData.orderTime}</p>
                    <p className="text-gray-600">Payment Type: {orderData.paymentType}</p>
                    <p className="text-gray-600">Payment Method: {orderData.payment}{orderData.payment === 'Part Payment' && orderData.paymentAmount ? ` (₦${parseFloat(orderData.paymentAmount).toLocaleString()})` : ''}</p>
                  </div>
                </div>
                
                {/* Items Table */}
                <div className="mb-8">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Item</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Warehouse</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Quantity</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Price</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.name}</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.warehouseNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.quantity}</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">₦{item.price.toLocaleString()}</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">₦{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Total */}
                <div className="text-right mb-8">
                  <div className="text-2xl font-bold text-[#02016a]">
                    Total: ₦{calculateTotal().toLocaleString()}
                  </div>
                </div>
                
                {/* Notes */}
                {orderData.orderNote && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes:</h3>
                    <p className="text-gray-600">{orderData.orderNote}</p>
                  </div>
                )}
                
                {/* Footer */}
                <div className="text-center text-gray-500 text-sm">
                  <p>Thank you for your business!</p>
                  <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
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
                      {customersLoading ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          Loading customers...
                        </div>
                      ) : customersError ? (
                        <div className="p-3 text-sm text-red-500 text-center">
                          {customersError}
                        </div>
                      ) : filteredCustomers.length > 0 ? (
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
                                </div>
                                {customer.email && <p className="text-xs text-gray-500">{customer.email}</p>}
                                {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
                                {customer.totalOrders && (
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-400">{customer.totalOrders} orders</span>
                                    {customer.lastOrderDate && (
                                  <span className="text-xs text-gray-400">Last: {customer.lastOrderDate}</span>
                                    )}
                                </div>
                                )}
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
                          value={newCustomerData.firstName}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, firstName: e.target.value }))}
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
                          value={newCustomerData.lastName}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
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
                        value={newCustomerData.email}
                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[14px] text-[#45464e] mb-2">Phone Number</label>
                    <div className="flex gap-3">
                      <div className="relative">
                        <select 
                          value={newCustomerData.countryCode}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, countryCode: e.target.value }))}
                          className="block w-24 pl-3 pr-8 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent appearance-none">
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
                        value={newCustomerData.phone}
                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
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
                        value={newCustomerData.address}
                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Type & Payment */}
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
                  <label className="block text-[14px] text-[#45464e] mb-2">Payment</label>
                  <select
                    value={orderData.payment}
                    onChange={(e) => setOrderData(prev => ({ ...prev, payment: e.target.value, paymentAmount: e.target.value === 'Full Payment' ? '' : prev.paymentAmount }))}
                    className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                  >
                    <option value="">Select Payment</option>
                    <option value="Full Payment">Full Payment</option>
                    <option value="Part Payment">Part Payment</option>
                  </select>
                </div>
              </div>

              {/* Payment Amount - Only show when Part Payment is selected */}
              {orderData.payment === 'Part Payment' && (
                <div>
                  <label className="block text-[14px] text-[#45464e] mb-2">Payment Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={orderData.paymentAmount}
                      onChange={(e) => setOrderData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                      placeholder="Enter payment amount"
                      className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent pl-10"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-[14px]">₦</span>
                  </div>
                </div>
              )}

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
                      className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent pl-10 pr-10"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const timeString = now.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                        setOrderData(prev => ({ ...prev, orderTime: timeString }));
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Set current time"
                    >
                      <svg className="w-4 h-4 text-gray-500 hover:text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
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
              {showProductList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {productsLoading ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Loading products...
                    </div>
                  ) : productsError ? (
                    <div className="p-3 text-sm text-red-500 text-center">
                      {productsError}
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      // Safety checks to ensure we have valid data
                      if (!product || typeof product !== 'object') return null;
                      
                      const productPrice = Number(product.sellingPrice || product.price || 0);
                      const productStock = Number(product.stock || product.quantity || 0);
                      const productName = String(product.name || 'Unknown Product');
                      const productCategory = String(product.category || '');
                      
                      return (
                        <div
                          key={String(product.id || '')}
                      onClick={() => addProductToOrder(product)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                              <h4 className="text-[14px] font-medium text-[#45464e]">{productName}</h4>
                              {productCategory && <p className="text-[12px] text-[#8b8d97]">{productCategory}</p>}
                        </div>
                        <div className="text-right">
                              <p className="text-[14px] font-medium text-[#45464e]">₦{productPrice.toLocaleString()}</p>
                              <p className="text-[12px] text-[#8b8d97]">Stock: {productStock}</p>
                        </div>
                      </div>
                    </div>
                      );
                    }).filter(Boolean)
                  ) : searchQuery.trim() ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      No products found
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Start typing to search products
                </div>
              )}
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
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInvoicePreview(true)}
              disabled={orderData.items.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-[14px] hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Invoice
            </button>
            <button
              onClick={printInvoice}
              disabled={orderData.items.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-[14px] hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
          </div>
          <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#02016a] text-[#02016a] rounded-lg font-medium text-[14px] hover:bg-[#f4f5fa] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creatingCustomer}
            className="px-6 py-2 bg-[#02016a] text-white rounded-lg font-medium text-[14px] hover:bg-[#03024a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creatingCustomer && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {creatingCustomer ? 'Creating Customer...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}
