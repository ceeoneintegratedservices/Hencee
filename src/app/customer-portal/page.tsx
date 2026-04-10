"use client";

import { useState, useEffect, useRef, useMemo, Suspense, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import {
  getMyProfile,
  getMyOrders,
  searchProducts as searchProductsAPI,
  createOrder as createOrderAPI,
  payDebt as payDebtAPI,
  requestRefund as requestRefundAPI,
  createSupportTicket,
} from "@/services/customerPortal";
import { listProducts } from "@/services/products";
import type { CustomerProfile, CustomerOrder } from "@/types/customerPortal";

const Chart = dynamic(() => import("react-apexcharts"), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center text-gray-400">Loading chart...</div>
}) as any;

interface Product {
  id: string;
  name: string;
  price?: number;
  sellingPrice?: number;
  category?: string;
  stock?: number;
  description?: string;
  sku?: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface OrderHistoryItem {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount?: number; // Amount paid so far
  outstandingBalance?: number; // from API when available (correct amount owing)
  paymentType?: string; // e.g. Bank Transfer, Cash, Cheque
  paymentDetailsUsed?: string; // e.g. bank account, reference
  items: Array<{
    productName: string;
    quantity: number;
    totalPrice: number;
  }>;
}

interface DebtRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  status: "pending" | "partial" | "overdue" | "cleared";
  dueDate?: string;
  paymentHistory: Array<{
    id: string;
    amount: number;
    date: string;
    method: string;
    reference?: string;
  }>;
}

type TabType = "history" | "order" | "refunds" | "support" | "debt";

function clearLegacyPortalAuth() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
    }
  } catch {
    /* ignore */
  }
}

function CustomerPortalLogoutButton({ className }: { className?: string }) {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        clearLegacyPortalAuth();
        void signOut({ redirectUrl: "/login" });
      }}
    >
      Logout
    </button>
  );
}

function CustomerPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial tab from URL query parameter
  const initialTab = (searchParams.get('tab') as TabType) || "history";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Update tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['history', 'order', 'refunds', 'support', 'debt'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [customerInfo, setCustomerInfo] = useState<CustomerProfile | null>(null);

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Fetch customer profile and orders on mount
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      setOrdersLoading(true);
      try {
        // Fetch customer profile
        const profile = await getMyProfile();
        setCustomerInfo(profile);

        // Fetch orders
        const ordersResponse = await getMyOrders({ limit: 50 });
        const ordersData = ordersResponse.data || [];
        
        // Transform API orders to local format
        const transformedOrders: OrderHistoryItem[] = ordersData.map((order: CustomerOrder & { paymentType?: string; paymentDetailsUsed?: string; paymentMethod?: string }) => ({
          id: order.id,
          createdAt: order.createdAt,
          status: order.status?.toLowerCase() || 'pending',
          paymentStatus: order.paymentStatus?.toLowerCase() || 'pending',
          totalAmount: order.totalAmount,
          paidAmount: order.paidAmount,
          outstandingBalance: order.outstandingBalance,
          paymentType: order.paymentType ?? order.paymentMethod,
          paymentDetailsUsed: order.paymentDetailsUsed,
          items: order.items?.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          })) || [],
        }));
        
        setOrders(transformedOrders);
      } catch (err) {
        console.error("Error fetching customer data:", err);
      } finally {
        setDataLoading(false);
        setOrdersLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to refresh orders after creating new one
  const refreshOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const ordersResponse = await getMyOrders({ limit: 50 });
      const ordersData = ordersResponse.data || [];
      
      const transformedOrders: OrderHistoryItem[] = ordersData.map((order: CustomerOrder & { paymentType?: string; paymentDetailsUsed?: string; paymentMethod?: string }) => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status?.toLowerCase() || 'pending',
        paymentStatus: order.paymentStatus?.toLowerCase() || 'pending',
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        outstandingBalance: order.outstandingBalance,
        paymentType: order.paymentType ?? order.paymentMethod,
        paymentDetailsUsed: order.paymentDetailsUsed,
        items: order.items?.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        })) || [],
      }));
      
      setOrders(transformedOrders);
    } catch (err) {
      console.error("Error refreshing orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Outstanding tab: show orders with outstanding balance (paidAmount < totalAmount when paidAmount is provided)
  const debts = useMemo<DebtRecord[]>(() => {
    return orders
      .filter(order => {
        const paid = order.paidAmount ?? 0;
        const hasExplicitPartial = order.paymentStatus === "partial";
        const hasOutstanding = typeof order.paidAmount === "number" && paid < order.totalAmount;
        return hasExplicitPartial || hasOutstanding;
      })
      .map(order => {
        const paidAmount = order.paidAmount ?? 0;
        const outstandingBalance = typeof order.outstandingBalance === "number"
          ? order.outstandingBalance
          : order.totalAmount - paidAmount;
        const orderDate = new Date(order.createdAt);
        const dueDate = new Date(orderDate);
        dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
        
        // Determine status
        let status: "pending" | "partial" | "overdue" | "cleared" = "partial";
        if (outstandingBalance <= 0) {
          status = "cleared";
        } else if (dueDate < new Date()) {
          status = "overdue";
        } else if (paidAmount === 0) {
          status = "pending";
        }
        
        return {
          id: `debt-${order.id}`,
          orderId: order.id,
          orderNumber: `#${order.id.slice(-6)}`,
          orderDate: order.createdAt,
          totalAmount: order.totalAmount,
          paidAmount: paidAmount,
          outstandingBalance: outstandingBalance,
          status: status,
          dueDate: dueDate.toISOString(),
          paymentHistory: paidAmount > 0 ? [{
            id: `payment-${order.id}`,
            amount: paidAmount,
            date: order.createdAt,
            method: "Bank Transfer",
            reference: `PAY-${order.id.slice(-6)}`
          }] : []
        };
      });
  }, [orders]);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<DebtRecord | null>(null);
  const [highlightedDebtOrderId, setHighlightedDebtOrderId] = useState<string | null>(null);
  const debtCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [debtPaymentAmount, setDebtPaymentAmount] = useState("");
  const [debtPaymentType, setDebtPaymentType] = useState("");
  const [debtSelectedBank, setDebtSelectedBank] = useState("");
  const [debtChequeReference, setDebtChequeReference] = useState("");
  const [debtChequeNumber, setDebtChequeNumber] = useState("");
  const [debtChequeAccountName, setDebtChequeAccountName] = useState("");
  const [debtChequeImagePreview, setDebtChequeImagePreview] = useState<string | null>(null);
  const [debtPaymentConfirmed, setDebtPaymentConfirmed] = useState(false);
  const [submittingDebtPayment, setSubmittingDebtPayment] = useState(false);
  const [showDebtPaymentTypeDropdown, setShowDebtPaymentTypeDropdown] = useState(false);
  const [showDebtBankDetailsDropdown, setShowDebtBankDetailsDropdown] = useState(false);
  const debtPaymentTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const debtBankDetailsDropdownRef = useRef<HTMLDivElement | null>(null);
  const debtChequeFileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductList, setShowProductList] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentType, setPaymentType] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [chequeReference, setChequeReference] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeAccountName, setChequeAccountName] = useState("");
  const [chequeImagePreview, setChequeImagePreview] = useState<string | null>(null);
  const [payment, setPayment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [orderInvoice, setOrderInvoice] = useState<any>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<"exchange" | "refund" | "">("");
  const [refundReason, setRefundReason] = useState("");
  const [refundItems, setRefundItems] = useState<string[]>([]);
  const [submittingRefund, setSubmittingRefund] = useState(false);
  
  const [exchangeSearchQuery, setExchangeSearchQuery] = useState("");
  const [exchangeFilteredProducts, setExchangeFilteredProducts] = useState<Product[]>([]);
  const [showExchangeProductList, setShowExchangeProductList] = useState(false);
  const [selectedItemsForExchange, setSelectedItemsForExchange] = useState<Set<number>>(new Set());
  const [productSelectingForExchange, setProductSelectingForExchange] = useState<string | null>(null);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [showRequestTypeDropdown, setShowRequestTypeDropdown] = useState(false);
  const orderDropdownRef = useRef<HTMLDivElement | null>(null);
  const requestTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const [showPaymentTypeDropdown, setShowPaymentTypeDropdown] = useState(false);
  const [showBankDetailsDropdown, setShowBankDetailsDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const paymentTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const bankDetailsDropdownRef = useRef<HTMLDivElement | null>(null);
  const paymentDropdownRef = useRef<HTMLDivElement | null>(null);
  const [exchangeSelectedItems, setExchangeSelectedItems] = useState<Array<{
    originalItem: { productName: string; quantity: number; totalPrice: number };
    originalItemIndex: number;
    newProduct: Product;
    quantity: number;
  }>>([]);
  const [exchangeInvoice, setExchangeInvoice] = useState<any>(null);
  const [exchangePaymentProof, setExchangePaymentProof] = useState<File | null>(null);
  const [exchangePaymentProofPreview, setExchangePaymentProofPreview] = useState<string | null>(null);
  const [exchangeAccountNumber, setExchangeAccountNumber] = useState("");
  const [exchangePaymentCompleted, setExchangePaymentCompleted] = useState(false);
  
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [submittingSupport, setSubmittingSupport] = useState(false);
  
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    show: boolean;
  }>({
    message: "",
    type: "info",
    show: false,
  });
  const notificationPopupRef = useRef<HTMLDivElement | null>(null);
  
  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type, show: true });
  };
  
  // Close notification
  const closeNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const [selectedOrderForDetails, setSelectedOrderDetails] =
    useState<OrderHistoryItem | null>(null);

  const [clickedDayOrders, setClickedDayOrders] = useState<{
    date: string;
    orders: OrderHistoryItem[];
    totalSpent: number;
  } | null>(null);

  const [selectedProductHistory, setSelectedProductHistory] = useState<{
    productName: string;
    purchases: Array<{
      date: string;
      orderId: string;
      quantity: number;
      amount: number;
    }>;
    totalQuantity: number;
    totalAmount: number;
  } | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const orderListRef = useRef<HTMLDivElement | null>(null);
  
  // Generate notifications including incomplete payment alerts
  const notifications = useMemo(() => {
    const incompletePaymentNotifications = debts
      .map((debt) => {
        const dueDate = new Date(debt.dueDate || debt.orderDate);
        const isOverdue = dueDate < new Date() && debt.outstandingBalance > 0;
        const daysOverdue = isOverdue 
          ? Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        const orderDate = new Date(debt.orderDate);
        const daysSinceOrder = Math.floor((new Date().getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let timeAgo = "";
        if (daysSinceOrder === 0) {
          timeAgo = "Today";
        } else if (daysSinceOrder === 1) {
          timeAgo = "1 day ago";
        } else if (daysSinceOrder < 7) {
          timeAgo = `${daysSinceOrder} days ago`;
        } else if (daysSinceOrder < 30) {
          const weeks = Math.floor(daysSinceOrder / 7);
          timeAgo = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
          const months = Math.floor(daysSinceOrder / 30);
          timeAgo = `${months} month${months > 1 ? 's' : ''} ago`;
        }
        
        return {
          id: `incomplete-${debt.id}`,
          title: isOverdue 
            ? `⚠️ Overdue Payment - ${debt.orderNumber}`
            : `Incomplete Payment - ${debt.orderNumber}`,
          message: isOverdue
            ? `Outstanding balance of ₦${debt.outstandingBalance.toLocaleString()} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. Please complete payment.`
            : `You have an outstanding balance of ₦${debt.outstandingBalance.toLocaleString()} for ${debt.orderNumber}. Please complete your payment.`,
          time: timeAgo,
          type: "payment" as const,
          unread: true,
          isIncompletePayment: true,
          debtId: debt.id,
          orderId: debt.orderId,
        };
      })
      .sort((a, b) => {
        // Sort overdue payments first
        const aIsOverdue = a.title.includes("Overdue");
        const bIsOverdue = b.title.includes("Overdue");
        if (aIsOverdue && !bIsOverdue) return -1;
        if (!aIsOverdue && bIsOverdue) return 1;
        return 0;
      });
    
    // Only show real outstanding-balance alerts (no static placeholders)
    return incompletePaymentNotifications;
  }, [debts]);
  
  // Count unread incomplete payment notifications
  const unreadIncompletePaymentsCount = useMemo(() => {
    return notifications.filter(n => n.unread && (n as any).isIncompletePayment).length;
  }, [notifications]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        orderDropdownRef.current &&
        !orderDropdownRef.current.contains(event.target as Node)
      ) {
        setShowOrderDropdown(false);
      }
      if (
        requestTypeDropdownRef.current &&
        !requestTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowRequestTypeDropdown(false);
      }
      if (
        paymentTypeDropdownRef.current &&
        !paymentTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPaymentTypeDropdown(false);
      }
      if (
        bankDetailsDropdownRef.current &&
        !bankDetailsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowBankDetailsDropdown(false);
      }
      if (
        paymentDropdownRef.current &&
        !paymentDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPaymentDropdown(false);
      }
      if (
        debtPaymentTypeDropdownRef.current &&
        !debtPaymentTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDebtPaymentTypeDropdown(false);
      }
      if (
        debtBankDetailsDropdownRef.current &&
        !debtBankDetailsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDebtBankDetailsDropdown(false);
      }
    };

    if (showOrderDropdown || showRequestTypeDropdown || showPaymentTypeDropdown || showBankDetailsDropdown || showPaymentDropdown || showDebtPaymentTypeDropdown || showDebtBankDetailsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOrderDropdown, showRequestTypeDropdown, showPaymentTypeDropdown, showBankDetailsDropdown, showPaymentDropdown, showDebtPaymentTypeDropdown, showDebtBankDetailsDropdown]);

  // Close notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notification.show &&
        notificationPopupRef.current &&
        !notificationPopupRef.current.contains(event.target as Node)
      ) {
        setNotification({ ...notification, show: false });
      }
    };

    if (notification.show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notification]);

  // Auto-populate payment amount with full outstanding balance when debt payment modal opens
  useEffect(() => {
    if (selectedDebtForPayment) {
      setDebtPaymentAmount(selectedDebtForPayment.outstandingBalance.toString());
    }
  }, [selectedDebtForPayment]);

  // Clear highlighted debt after 3 seconds
  useEffect(() => {
    if (highlightedDebtOrderId) {
      const timer = setTimeout(() => {
        setHighlightedDebtOrderId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedDebtOrderId]);

  // Clear highlight when tab changes
  useEffect(() => {
    if (activeTab !== "debt") {
      setHighlightedDebtOrderId(null);
    }
  }, [activeTab]);

  // Fetch products when order tab is active
  useEffect(() => {
    if (activeTab === "order" && products.length === 0) {
      const fetchInitialProducts = async () => {
        setProductsLoading(true);
        try {
          // Fetch all products using listProducts (same as admin)
          const productsArray = await listProducts({ limit: 100 });
          
          const transformedProducts: Product[] = productsArray.map((p: any) => {
            const categoryValue = typeof p.category === 'string' 
              ? p.category 
              : (p.category && typeof p.category === 'object' 
                ? (p.category?.name || p.category?.label || '')
                : '');
            return {
              id: p.id,
              name: p.name,
              price: p.sellingPrice || p.price,
              sellingPrice: p.sellingPrice || p.price,
              category: categoryValue,
              stock: p.stock || p.quantity || 0,
              description: p.description || '',
              sku: p.sku,
            };
          });
          setProducts(transformedProducts);
          setFilteredProducts(transformedProducts);
        } catch (err) {
          console.error("Error fetching products:", err);
          // Fallback to search API if listProducts fails
          try {
            const results = await searchProductsAPI({ q: "" });
            const transformedProducts: Product[] = results.map(p => {
              const categoryValue = typeof p.category === 'string' 
                ? p.category 
                : (p.category && typeof p.category === 'object' 
                  ? ((p.category as any)?.name || (p.category as any)?.label || '')
                  : '');
              return {
                id: p.id,
                name: p.name,
                price: p.sellingPrice,
                sellingPrice: p.sellingPrice,
                category: categoryValue,
                stock: p.stock,
                description: p.description,
                sku: p.sku,
              };
            });
            setProducts(transformedProducts);
            setFilteredProducts(transformedProducts);
          } catch (searchErr) {
            console.error("Error fetching products via search:", searchErr);
          }
        } finally {
          setProductsLoading(false);
        }
      };
      fetchInitialProducts();
    }
  }, [activeTab]);

  // Search products from initially loaded products when search query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Filter from initially loaded products
      const filtered = products.filter(product => {
        const searchLower = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          (product.category && typeof product.category === 'string' && product.category.toLowerCase().includes(searchLower)) ||
          (product.description && product.description.toLowerCase().includes(searchLower)) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower))
        );
      });
      setFilteredProducts(filtered);
      setShowProductList(filtered.length > 0);
    } else {
      // Clear search results when query is empty or too short
      setFilteredProducts([]);
      setShowProductList(false);
    }
  }, [searchQuery, products]);

  const addProductToOrder = (product: Product) => {
    if (orderInvoice) {
      setOrderInvoice(null);
      setPaymentConfirmed(false);
    }
    
    const existingItem = orderItems.find(item => item.id === product.id);
    const productPrice = product.sellingPrice || product.price || 0;
    
    if (existingItem) {
      const updatedItems = orderItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * productPrice }
          : item
      );
      setOrderItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        id: product.id,
        name: product.name,
        price: productPrice,
        quantity: 1,
        total: productPrice
      };
      setOrderItems([...orderItems, newItem]);
    }
    
    setSearchQuery("");
    setShowProductList(false);
  };

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(item => item.id !== productId));
      return;
    }

    const updatedItems = orderItems.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    );
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.total, 0);
  };

  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      showNotification("Please add at least one product to your order", "error");
          return;
        }

    if (!paymentType || !payment) {
      showNotification("Please select payment type and payment method", "error");
      return;
    }

    if (!paymentConfirmed) {
      showNotification("Please confirm that payment has been transferred to the account provided", "error");
      return;
    }

    try {
      setCreatingOrder(true);

      // Prepare payload for API
      const orderPayload = {
        items: orderItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentType: payment === "Part Payment" ? "PARTIAL" as const : "FULL" as const,
        paymentMethod: paymentType === "Bank Transfer" ? "TRANSFER" as const : 
                       paymentType === "Cash" ? "CASH" as const : 
                       paymentType === "Cheque" ? "CHEQUE" as const : "TRANSFER" as const,
        paymentAmount: payment === "Part Payment" ? parseFloat(paymentAmount) : calculateTotal(),
        note: orderNote || undefined,
      };

      // Call API to create order
      const createdOrder = await createOrderAPI(orderPayload);

      const amountPaid = payment === "Part Payment" ? parseFloat(paymentAmount) : calculateTotal();
      const bankLabel = selectedBank === "gtb" ? "GTB" : selectedBank === "access" ? "Access Bank" : selectedBank === "zenith" ? "Zenith Bank" : selectedBank || "";
      const bankAccount = selectedBank === "gtb" ? "0123456789" : selectedBank === "access" ? "1234567890" : selectedBank === "zenith" ? "9876543210" : "";
      let paymentDetailsUsed = paymentType;
      if (paymentType === "Bank Transfer" && bankLabel) paymentDetailsUsed = `Bank Transfer — ${bankLabel} (${bankAccount})`;
      else if (paymentType === "Cheque" && (chequeReference || chequeNumber || chequeAccountName)) {
        const parts = ["Cheque"];
        if (chequeReference) parts.push(`Ref: ${chequeReference}`);
        if (chequeNumber) parts.push(`No: ${chequeNumber}`);
        if (chequeAccountName) parts.push(`Account: ${chequeAccountName}`);
        paymentDetailsUsed = parts.join(" — ");
      } else if (paymentType === "Cash") paymentDetailsUsed = "Cash";

      const invoice = {
        orderNumber: createdOrder.orderNumber || createdOrder.id,
        orderDate: createdOrder.createdAt || new Date().toISOString(),
        items: orderItems,
        paymentType,
        payment,
        paymentAmount: payment === "Part Payment" ? paymentAmount : calculateTotal().toString(),
        amountPaid,
        paymentDetailsUsed,
        orderNote,
        totalAmount: calculateTotal(),
        status: createdOrder.status || "pending",
        createdAt: createdOrder.createdAt || new Date().toISOString(),
      };
      
      setOrderInvoice(invoice);
      showNotification("Order created successfully! Invoice generated.", "success");

      // Refresh orders list
      await refreshOrders();

      // If backend didn't return paidAmount for the new order, patch it so order history shows correct paid/outstanding
      setOrders((prev) => {
        const apiPaid = createdOrder.paidAmount ?? (createdOrder as any).paidAmount;
        if (apiPaid != null && apiPaid > 0) return prev;
        const total = createdOrder.totalAmount ?? calculateTotal();
        const paid = amountPaid;
        if (paid <= 0 || paid >= total) return prev;
        return prev.map((o) =>
          o.id === createdOrder.id
            ? {
                ...o,
                paidAmount: paid,
                paymentStatus: (o.paymentStatus === "partial" ? "partial" : "partial") as string,
              }
            : o
        );
      });

      setOrderItems([]);
      setPaymentType("");
      setPayment("");
      setPaymentAmount("");
      setOrderNote("");
      setPaymentConfirmed(false);
      setSelectedBank("");
      setChequeReference("");
      setChequeNumber("");
      setChequeAccountName("");
      setChequeImagePreview(null);
    } catch (err: any) {
      console.error("Error creating order:", err);
      showNotification(err.message || "Failed to create order", "error");
    } finally {
      setCreatingOrder(false);
    }
  };

  useEffect(() => {
    if (exchangeSearchQuery.trim()) {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(exchangeSearchQuery.toLowerCase())
      );
      setExchangeFilteredProducts(filtered);
      setShowExchangeProductList(true);
    } else {
      setExchangeFilteredProducts([]);
      setShowExchangeProductList(false);
    }
    setProductSelectingForExchange(null);
  }, [exchangeSearchQuery, products]);

  // Reset to page 1 when switching to history tab
  useEffect(() => {
    if (activeTab === "history") {
      setCurrentPage(1);
    }
  }, [activeTab]);

  // Smooth scroll to order list when page changes

  const getSelectedOrder = () => {
    return orders.find((order) => order.id === selectedOrderForRefund);
  };

  const toggleItemSelection = (index: number) => {
    const newSelected = new Set(selectedItemsForExchange);
    if (newSelected.has(index)) {
      newSelected.delete(index);
      setExchangeSelectedItems(exchangeSelectedItems.filter(item => item.originalItemIndex !== index));
    } else {
      newSelected.add(index);
    }
    setSelectedItemsForExchange(newSelected);
  };

  const addProductToExchange = (product: Product, originalItem: { productName: string; quantity: number; totalPrice: number }, originalItemIndex: number) => {
    const existingIndex = exchangeSelectedItems.findIndex(
      (item) => item.originalItemIndex === originalItemIndex && item.newProduct.id === product.id
    );

    if (existingIndex >= 0) {
      const updated = [...exchangeSelectedItems];
      updated[existingIndex].quantity += 1;
      setExchangeSelectedItems(updated);
    } else {
      setExchangeSelectedItems([
        ...exchangeSelectedItems,
        {
          originalItem,
          originalItemIndex,
          newProduct: product,
          quantity: 1,
        },
      ]);
    }
    setExchangeSearchQuery("");
    setShowExchangeProductList(false);
    setProductSelectingForExchange(null);
  };

  const removeExchangeItem = (index: number) => {
    setExchangeSelectedItems(exchangeSelectedItems.filter((_, i) => i !== index));
  };

  const updateExchangeQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const updated = [...exchangeSelectedItems];
    updated[index].quantity = quantity;
    setExchangeSelectedItems(updated);
  };

  const generateExchangeInvoice = () => {
    if (!selectedOrderForRefund || exchangeSelectedItems.length === 0) {
      showNotification("Please select an order and add exchange items", "error");
      return;
    }

    const order = getSelectedOrder();
    if (!order) return;

    let totalDifference = 0;

    exchangeSelectedItems.forEach((item) => {
      const originalTotal = item.originalItem.totalPrice;
      const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
      totalDifference += newTotal - originalTotal;
    });

    const invoice = {
      orderNumber: `${order.id.slice(-6)}E`,
      originalOrderNumber: order.id.slice(-6),
      originalOrder: order,
      exchangeItems: exchangeSelectedItems,
      totalDifference,
      status: totalDifference > 0 ? "payment_required" : "credit_owed",
      createdAt: new Date().toISOString(),
    };

    setExchangeInvoice(invoice);
  };

  const handleSubmitExchange = async () => {
    if (!selectedOrderForRefund) {
      showNotification("Please select an order", "error");
      return;
    }

    if (exchangeSelectedItems.length === 0) {
      showNotification("Please add items to exchange", "error");
      return;
    }

    if (!refundReason.trim()) {
      showNotification("Please provide a reason for the exchange", "error");
      return;
    }

    // Calculate total difference
    const totalDiff = exchangeSelectedItems.reduce((sum, item) => {
      const originalTotal = item.originalItem.totalPrice;
      const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
      return sum + (newTotal - originalTotal);
    }, 0);

    if (totalDiff > 0) {
      if (!exchangePaymentProof) {
        showNotification("Please upload proof of payment before submitting your exchange request.", "error");
        return;
      }
      if (!exchangePaymentCompleted) {
        showNotification("Please complete payment and upload proof before submitting.", "error");
        return;
      }
    }

    if (totalDiff < 0) {
      const accountNumberMatch = refundReason.match(/\d{10,}/);
      if (!accountNumberMatch) {
        showNotification("Please include your account number in the reason field. The account must be in your name (same as your customer account).", "error");
        return;
      }
      setExchangeAccountNumber(accountNumberMatch[0]);
    }

    try {
      setSubmittingRefund(true);
      
      // Call API to submit exchange request
      const exchangePayload = {
        orderId: selectedOrderForRefund,
        type: 'exchange' as const,
        reason: refundReason,
        items: exchangeSelectedItems.map(item => ({
          productId: item.newProduct.id,
          quantity: item.quantity,
        })),
        replacementProductId: exchangeSelectedItems[0]?.newProduct.id,
      };
      
      await requestRefundAPI(exchangePayload);
      
      generateExchangeInvoice();
      showNotification("Exchange request submitted successfully! Invoice generated. Our team will review your request.", "success");
    } catch (err: any) {
      console.error("Error submitting exchange:", err);
      showNotification(err.message || "Failed to submit exchange request", "error");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleSubmitRefund = async () => {
    if (!selectedOrderForRefund) {
      showNotification("Please select an order", "error");
      return;
    }

    if (!refundReason.trim()) {
      showNotification("Please provide a reason for the refund", "error");
      return;
    }

    try {
      setSubmittingRefund(true);
      
      // Get selected order to find items
      const order = orders.find(o => o.id === selectedOrderForRefund);
      
      // Call API to submit refund request
      const refundPayload = {
        orderId: selectedOrderForRefund,
        type: 'refund' as const,
        reason: refundReason,
        items: order?.items?.map((item, idx) => ({
          productId: refundItems.includes(String(idx)) ? `item-${idx}` : '',
          quantity: item.quantity,
        })).filter(i => i.productId) || [],
      };
      
      await requestRefundAPI(refundPayload);
      
      showNotification("Refund request submitted successfully! Our team will review your request.", "success");
      setSelectedOrderForRefund(null);
      setRefundReason("");
      setRefundItems([]);
      setRequestType("");
    } catch (err: any) {
      console.error("Error submitting refund:", err);
      showNotification(err.message || "Failed to submit refund request", "error");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleSubmitSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      showNotification("Please fill in all fields", "error");
      return;
    }

    try {
      setSubmittingSupport(true);
      
      // Call API to create support ticket
      await createSupportTicket({
        subject: supportSubject,
        message: supportMessage,
      });
      
      showNotification("Support request submitted successfully! We'll get back to you soon.", "success");
      setSupportSubject("");
      setSupportMessage("");
    } catch (err: any) {
      console.error("Error submitting support:", err);
      showNotification(err.message || "Failed to submit support request", "error");
    } finally {
      setSubmittingSupport(false);
    }
  };

  // Chart data calculations - Daily data points with clickable days
  const getOrderChartData = () => {
    const dailyData: Array<{ x: number, y: number, orders: OrderHistoryItem[] }> = [];
    const years = new Set<number>();
    const currentDate = new Date();
    const dataMap: { [key: string]: { count: number, orders: OrderHistoryItem[] } } = {};
    
    // Process all orders and group by day
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dayKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const timestamp = new Date(dayKey).getTime();
      
      years.add(orderDate.getFullYear());
      
      if (!dataMap[dayKey]) {
        dataMap[dayKey] = { count: 0, orders: [] };
      }
      dataMap[dayKey].count += 1;
      dataMap[dayKey].orders.push(order);
    });
    
    // Convert to array format for ApexCharts
    Object.keys(dataMap).sort().forEach(dayKey => {
      const timestamp = new Date(dayKey).getTime();
      dailyData.push({
        x: timestamp,
        y: dataMap[dayKey].count,
        orders: dataMap[dayKey].orders
      });
    });
    
    const yearRange = Array.from(years).sort().join(' - ');
    
    return { 
      data: dailyData,
      yearRange
    };
  };

  const getMostPurchasedItems = () => {
    const itemCounts: { [key: string]: number } = {};
    const itemHistory: { [key: string]: Array<{
      date: string;
      orderId: string;
      quantity: number;
      amount: number;
    }> } = {};
    
    // Only count completed orders in most purchased items
    orders
      .filter(order => order.status === 'completed')
      .forEach(order => {
        order.items?.forEach(item => {
          itemCounts[item.productName] = (itemCounts[item.productName] || 0) + item.quantity;
          
          if (!itemHistory[item.productName]) {
            itemHistory[item.productName] = [];
          }
          
          itemHistory[item.productName].push({
            date: order.createdAt,
            orderId: order.id,
            quantity: item.quantity,
            amount: item.totalPrice || 0
          });
        });
      });
    
    const sorted = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return {
      items: sorted.map(([name]) => name),
      quantities: sorted.map(([, qty]) => qty),
      history: itemHistory
    };
  };

  const getOrderStatusData = () => {
    const statusCounts: { [key: string]: number } = {};
    
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    return {
      labels: Object.keys(statusCounts),
      series: Object.values(statusCounts)
    };
  };

  const getSpendingTrendData = () => {
    const dailyData: Array<{ x: number, y: number, orders: OrderHistoryItem[] }> = [];
    const years = new Set<number>();
    const dataMap: { [key: string]: { total: number, orders: OrderHistoryItem[] } } = {};
    
    // Process all orders and group by day
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dayKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const timestamp = new Date(dayKey).getTime();
      
      years.add(orderDate.getFullYear());
      
      if (!dataMap[dayKey]) {
        dataMap[dayKey] = { total: 0, orders: [] };
      }
      dataMap[dayKey].total += order.totalAmount;
      dataMap[dayKey].orders.push(order);
    });
    
    // Convert to array format for ApexCharts
    Object.keys(dataMap).sort().forEach(dayKey => {
      const timestamp = new Date(dayKey).getTime();
      dailyData.push({
        x: timestamp,
        y: dataMap[dayKey].total,
        orders: dataMap[dayKey].orders
      });
    });
    
    const yearRange = Array.from(years).sort().join(' - ');
    
    return { 
      data: dailyData,
      yearRange 
    };
  };

  const orderChartData = getOrderChartData();
  const mostPurchased = getMostPurchasedItems();
  const statusData = getOrderStatusData();
  const spendingData = getSpendingTrendData();

  // Calculate initial date range (last 6 months) for monthly view
  const getInitialDateRange = () => {
    const currentDate = new Date();
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      min: sixMonthsAgo.getTime(),
      max: endDate.getTime()
    };
  };

  const initialDateRange = getInitialDateRange();
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

  if (loading) {
  return (
      <div className="min-h-screen bg-[#f4f5fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02016a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
                </div>
                  </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5fa] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
      {/* Header – styled to match admin header but with customer dashboard text */}
      <header className="bg-white flex items-center justify-between px-3 sm:px-4 md:px-5 py-3 sm:py-4 shadow-sm w-full border-b border-gray-200 relative z-50">
        {/* Left: Logo + title */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Image
              src="/icons/logoIcon.png"
              alt="Hencee Pharmaceuticals"
              width={100}
              height={100}
              className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 object-contain flex-shrink-0"
            />
            <h1 className="text-base sm:text-lg md:text-[22px] font-medium text-[#45464e] truncate">
              Hencee Pharmaceuticals
            </h1>
                </div>
          <span className="text-gray-300 text-base sm:text-lg hidden sm:inline">|</span>
          <span className="text-xs sm:text-sm md:text-base text-[#8b8d97] font-medium hidden md:inline truncate">
            Customer Dashboard
          </span>
                </div>

        {/* Right: Welcome text + notification bell + customer icon */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-600">Welcome,</p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">
              {customerInfo?.name || "Customer"}
              </p>
                </div>

          {/* Notification bell with dropdown (recent payments, orders, products) */}
          <div className="relative z-[100]" ref={notificationRef}>
                <button
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors relative z-[100]"
              aria-label="Notifications"
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <Image
                src="/icons/Notification.png"
                alt="Notifications"
                width={20}
                height={20}
                className="w-5 h-5 lg:w-6 lg:h-6 object-contain"
              />
              {(unreadIncompletePaymentsCount > 0 || notifications.filter((n) => n.unread && !(n as any).isIncompletePayment).length > 0) && (
                <span className={`absolute -top-1 -right-1 text-white text-xs lg:text-sm rounded-full w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center font-bold ${
                  unreadIncompletePaymentsCount > 0 ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  {unreadIncompletePaymentsCount > 0 
                    ? unreadIncompletePaymentsCount 
                    : notifications.filter((n) => n.unread && !(n as any).isIncompletePayment).length}
                </span>
              )}
                </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-[100] max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recent Activity
                    </h3>
                <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {unreadIncompletePaymentsCount > 0 
                      ? `${unreadIncompletePaymentsCount} incomplete payment${unreadIncompletePaymentsCount !== 1 ? 's' : ''} • Latest activity`
                      : "Latest payments, orders, and new products"}
              </p>
            </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => {
                    const isIncompletePayment = (notification as any).isIncompletePayment;
                    const isOverdue = notification.title.includes("Overdue");
                    
                    return (
                      <div
                        key={notification.id}
                        onClick={() => {
                          if (isIncompletePayment) {
                            setActiveTab("debt");
                            setShowNotifications(false);
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          }
                        }}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                          isIncompletePayment ? "cursor-pointer" : ""
                        } ${
                          notification.unread 
                            ? isOverdue 
                              ? "bg-red-50" 
                              : isIncompletePayment 
                              ? "bg-orange-50" 
                              : "bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              isOverdue
                                ? "bg-red-500"
                                : isIncompletePayment
                                ? "bg-orange-500"
                                : notification.type === "payment"
                                ? "bg-blue-500"
                                : notification.type === "order"
                                ? "bg-green-500"
                                : "bg-purple-500"
                            }`}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              {notification.unread && (
                                <span className={`text-[10px] font-semibold ${
                                  isOverdue 
                                    ? "text-red-600" 
                                    : isIncompletePayment 
                                    ? "text-orange-600" 
                                    : "text-blue-600"
                                }`}>
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                            {isIncompletePayment && (
                              <p className="text-xs text-[#02016a] font-medium mt-2">
                                Click to view outstanding balance →
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-gray-100">
                <button
                    type="button"
                    className="w-full text-center text-sm text-[#02016a] hover:text-[#03024a] font-medium"
                  >
                    View All Activity
                </button>
                </div>
            </div>
          )}
            </div>

          {/* Customer avatar – navigates to customer info page (demo) */}
                <button
            type="button"
            onClick={() => router.push("/customer-portal/customer-info")}
            className="w-9 h-9 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-full overflow-hidden hover:ring-2 hover:ring-[#02016a] hover:ring-offset-2 transition-all bg-[#02016a] flex items-center justify-center"
            aria-label="Customer info"
          >
            <span className="text-white text-sm lg:text-base xl:text-lg font-bold">
              {(customerInfo?.name || "Kevin Mezie")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
                </button>
                  </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6">
          <nav className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            {/* First Row: Main Tabs */}
            <div className="flex w-full lg:w-auto space-x-0 sm:space-x-1 md:space-x-2 lg:space-x-4 xl:space-x-6 pb-2 lg:pb-0">
              {[
                {
                  id: "history" as TabType,
                  label: "Order History",
                  mobileLabel: "Order",
                  icon: (
                    <Image
                      src="/icons/orders.png"
                      alt="Order history"
                      width={18}
                      height={18}
                      className="w-5 h-5 object-contain"
                    />
                  ),
                },
                {
                  id: "order" as TabType,
                  label: "Place Order",
                  mobileLabel: "Place Order",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  ),
                },
                {
                  id: "refunds" as TabType,
                  label: "Exchange & Refunds",
                  mobileLabel: "Exchange",
                  icon: (
                    <Image
                      src="/icons/reports.png"
                      alt="Exchange and refunds"
                      width={18}
                      height={18}
                      className="w-5 h-5 object-contain"
                    />
                  ),
                },
                {
                  id: "debt" as TabType,
                  label: "Outstanding Balance",
                  mobileLabel: "Outstanding",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                      <path d="M7 14h.01M15 14h.01"></path>
                    </svg>
                  ),
                },
                {
                  id: "support" as TabType,
                  label: "Customer Service",
                  mobileLabel: "",
                  icon: (
                    <Image
                      src="/icons/customers.png"
                      alt="Customer service"
                      width={18}
                      height={18}
                      className="w-5 h-5 object-contain"
                    />
                  ),
                },
              ].map((tab) => {
                const isSupport = tab.id === "support";
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${isSupport ? "hidden lg:flex lg:flex-none" : "flex flex-1 lg:flex-none"} py-3 sm:py-3.5 md:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm md:text-base items-center justify-center gap-1 sm:gap-1.5 md:gap-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-[#02016a] text-[#02016a]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="hidden min-[361px]:flex flex-shrink-0">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.mobileLabel || tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Second Row (Mobile/Tablet): Customer Service (Icon Only) & Logout */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3 md:space-x-4 lg:hidden pt-2 border-t border-gray-200">
              <button
                onClick={() => setActiveTab("support")}
                className={`py-3 sm:py-3.5 md:py-4 px-2 sm:px-3 md:px-4 border-b-2 font-medium flex items-center justify-center transition-colors flex-shrink-0 ${
                  activeTab === "support"
                    ? "border-[#02016a] text-[#02016a]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                aria-label="Customer Service"
              >
                <Image
                  src="/icons/customers.png"
                  alt="Customer service"
                  width={18}
                  height={18}
                  className="hidden min-[361px]:block w-5 h-5 sm:w-6 sm:h-6 object-contain"
                />
              </button>
              
              {/* Logout button */}
              <CustomerPortalLogoutButton className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 flex-shrink-0 py-3 sm:py-3.5 md:py-4" />
            </div>
            
            {/* Logout button for Desktop (appears after Customer Service in main row) */}
            <div className="hidden lg:flex items-center">
              <CustomerPortalLogoutButton className="text-sm font-bold text-red-600 hover:text-red-700 flex-shrink-0 py-4 ml-4 lg:ml-6" />
            </div>
          </nav>
        </div>
      </div>

      {/* Toast for copy account number */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="rounded-lg bg-gray-900 text-white px-4 py-3 shadow-lg text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
                      </svg>
            <span>{copyToast}</span>
                  </div>
        </div>
      )}

      {/* Notification Popup */}
      {notification.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div
            ref={notificationPopupRef}
            className={`bg-white rounded-xl shadow-2xl max-w-md w-full p-6 ${
              notification.type === "success"
                ? "border-l-4 border-green-500"
                : notification.type === "error"
                ? "border-l-4 border-red-500"
                : "border-l-4 border-blue-500"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.type === "success"
                    ? "bg-green-100"
                    : notification.type === "error"
                    ? "bg-red-100"
                    : "bg-blue-100"
                }`}
              >
                {notification.type === "success" ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : notification.type === "error" ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold mb-1 ${
                    notification.type === "success"
                      ? "text-green-900"
                      : notification.type === "error"
                      ? "text-red-900"
                      : "text-blue-900"
                  }`}
                >
                  {notification.type === "success"
                    ? "Success"
                    : notification.type === "error"
                    ? "Error"
                    : "Information"}
                </h3>
                <p className="text-sm text-gray-700">{notification.message}</p>
                </div>
                <button
                type="button"
                onClick={closeNotification}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close notification"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </div>
          </div>
            </div>
          )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6 lg:py-8 overflow-x-hidden">
        {/* Order History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {ordersLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <svg className="animate-spin h-12 w-12 text-[#02016a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No orders found</p>
                  <p className="text-sm text-gray-500 mt-2">Start by placing your first order!</p>
                </div>
              </div>
            ) : (
              <>
                {/* Highlights Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 text-white">
                    <p className="text-xs sm:text-sm md:text-base opacity-90 mb-1 sm:mb-2">Total Orders</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{orders.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 text-white">
                    <p className="text-xs sm:text-sm md:text-base opacity-90 mb-1 sm:mb-2">Total Spent</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold break-words">₦{totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 text-white">
                    <p className="text-xs sm:text-sm md:text-base opacity-90 mb-1 sm:mb-2">Average Order</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold break-words">₦{Math.round(averageOrderValue).toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 text-white">
                    <p className="text-xs sm:text-sm md:text-base opacity-90 mb-1 sm:mb-2">Most Purchased</p>
                    <p className="text-base sm:text-lg md:text-xl font-bold break-words">{mostPurchased.items[0] || "N/A"}</p>
                  </div>
                </div>

                {/* Order List */}
                <div ref={orderListRef} className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-5 md:mb-6">Order History</h2>
                  
                  {/* Pagination Info */}
                  {orders.length > itemsPerPage && (
                    <div className="mb-4 text-sm text-gray-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} orders
            </div>
          )}

                  <div className="space-y-4">
                    {orders
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((order, index) => {
                        const hasPartialPayment = order.paymentStatus === "partial" || 
                          (order.paidAmount !== undefined && order.paidAmount > 0 && order.paidAmount < order.totalAmount);
                        const outstandingBalance = hasPartialPayment 
                          ? (order.totalAmount - (order.paidAmount || 0))
                          : 0;

  return (
                          <div
                            key={order.id}
                            className="border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer"
                            onClick={() => setSelectedOrderDetails(order)}
                            style={{
                              animation: `fadeIn 0.4s ease-in-out ${index * 0.05}s both`
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg">Order #{order.id.slice(-6)}</h3>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                  {hasPartialPayment && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 whitespace-nowrap">
                                      Partial Payment
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 md:mb-3">
                                  Date: {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                <div className="space-y-1 md:space-y-1.5">
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className="text-xs sm:text-sm md:text-base text-gray-700 break-words">
                                      <span className="font-medium">{item.productName}</span> × {item.quantity} - ₦{(item.totalPrice || 0).toLocaleString()}
                                    </div>
                                  ))}
                                </div>
                                {hasPartialPayment && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-600 mb-2 break-words">
                                      Outstanding: <span className="font-semibold text-orange-600">₦{outstandingBalance.toLocaleString()}</span>
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Find the corresponding debt for this order
                                        const correspondingDebt = debts.find(debt => debt.orderId === order.id);
                                        if (correspondingDebt) {
                                          setHighlightedDebtOrderId(order.id);
                                          setActiveTab("debt");
                                          // Scroll to the debt card after a short delay to ensure it's rendered
                                          setTimeout(() => {
                                            const debtCard = debtCardRefs.current[order.id];
                                            if (debtCard) {
                                              debtCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            } else {
                                              window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                          }, 300);
                                        } else {
                                          setActiveTab("debt");
                                          setTimeout(() => {
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }, 100);
                                        }
                                      }}
                                      className="text-xs px-3 py-1.5 bg-[#02016a] text-white rounded-lg hover:bg-[#03024a] transition-colors font-medium w-full sm:w-auto"
                                    >
                                      View Outstanding Balance
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="text-left sm:text-right sm:ml-4 md:ml-6 flex-shrink-0">
                                <p className="text-base sm:text-lg md:text-xl font-bold text-[#02016a]">
                                  ₦{order.totalAmount.toLocaleString()}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 md:mt-2">
                                  {order.paymentStatus}
                                </p>
                                {hasPartialPayment && (
                                  <p className="text-xs sm:text-sm text-green-600 mt-1 md:mt-2">
                                    Paid: ₦{(order.paidAmount || 0).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Pagination Controls */}
                  {orders.length > itemsPerPage && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {Math.ceil(orders.length / itemsPerPage)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#02016a] text-white hover:bg-[#03024a]'
                            }`}
                          >
                            Previous
                          </button>
                          
                  <div className="flex items-center gap-2">
                            {Array.from({ length: Math.ceil(orders.length / itemsPerPage) }, (_, i) => i + 1).map((page) => {
                              // Show first page, last page, current page, and pages around current
                              const totalPages = Math.ceil(orders.length / itemsPerPage);
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[40px] ${
                                      currentPage === page
                                        ? 'bg-[#02016a] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {page}
                </button>
                                );
                              } else if (
                                page === currentPage - 2 ||
                                page === currentPage + 2
                              ) {
                                return <span key={page} className="px-2 text-gray-400">...</span>;
                              }
                              return null;
                            })}
                          </div>
                          
                <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(orders.length / itemsPerPage), prev + 1))}
                            disabled={currentPage === Math.ceil(orders.length / itemsPerPage)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === Math.ceil(orders.length / itemsPerPage)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#02016a] text-white hover:bg-[#03024a]'
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                  {/* Order Status Breakdown */}
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-5">Order Status</h3>
                    {typeof window !== 'undefined' && Chart ? (
                      <Chart
                        options={{
                          chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
                          colors: ['#059669', '#d97706', '#4b5563'],
                          labels: statusData.labels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                          legend: { position: 'bottom' },
                          dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
                        }}
                        series={statusData.series}
                        type="donut"
                        height={300}
                      />
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <p className="mb-2">Chart loading...</p>
                          <p className="text-xs text-gray-500">If charts don't load, please install: yarn add apexcharts react-apexcharts</p>
                        </div>
            </div>
          )}
                  </div>

                  {/* Most Purchased Items */}
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Purchased Items</h3>
                    <p className="text-xs text-gray-500 mb-4">Click on any product to see purchase history</p>
                    {typeof window !== 'undefined' && Chart ? (
                      <Chart
                        options={{
                          chart: { 
                            type: 'bar', 
                            toolbar: { show: false }, 
                            fontFamily: 'Inter, sans-serif',
                            events: {
                              dataPointSelection: (event: any, chartContext: any, config: any) => {
                                const dataPointIndex = config.dataPointIndex;
                                const productName = mostPurchased.items[dataPointIndex];
                                
                                if (productName && mostPurchased.history && mostPurchased.history[productName]) {
                                  const purchases = mostPurchased.history[productName];
                                  const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
                                  const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);
                                  
                                  setSelectedProductHistory({
                                    productName,
                                    purchases: purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                                    totalQuantity,
                                    totalAmount
                                  });
                                }
                              }
                            }
                          },
                          colors: ['#02016a'],
                          plotOptions: {
                            bar: { horizontal: true, borderRadius: 4 }
                          },
                          dataLabels: { enabled: true },
                          xaxis: { categories: mostPurchased.items },
                          yaxis: { title: { text: 'Quantity' } },
                          grid: { borderColor: '#f1f5f9' },
                        }}
                        series={[{ name: 'Quantity', data: mostPurchased.quantities }]}
                        type="bar"
                        height={300}
                      />
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <p className="mb-2">Chart loading...</p>
                          <p className="text-xs text-gray-500">If charts don't load, please install: yarn add apexcharts react-apexcharts</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </>
            )}
          </div>
        )}

        {/* Place Order Tab */}
        {activeTab === "order" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Place New Order</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Product Search and Selection */}
                <div>
                <div className="mb-4 max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Products
                  </label>
                  <div className="relative max-w-md">
                  <input
                    type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={productsLoading ? "Loading products..." : "Search for products..."}
                      disabled={productsLoading}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02016a] disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {productsLoading ? (
                      <svg className="absolute right-3 top-3.5 w-5 h-5 text-[#02016a] animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                    
                    {/* Product List - appears immediately after search input */}
                    {showProductList && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full max-w-md mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => addProductToOrder(product)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                                {product.category && (
                                  <p className="text-xs text-gray-500">
                                    {typeof product.category === 'string' 
                                      ? product.category 
                                      : (product.category as any)?.name || (product.category as any)?.label || ''}
                                  </p>
                                )}
                </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">₦{(product.sellingPrice || product.price || 0).toLocaleString()}</p>
                                {product.stock !== undefined && (
                                  <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                              </div>

                {/* Selected Products */}
                {orderItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Products</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {orderItems.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between gap-4">
                            {/* Left: Product Name and Price */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">{item.name}</h4>
                              <p className="text-xs text-gray-500">₦{item.price.toLocaleString()} each</p>
                            </div>
                            
                            {/* Middle: Quantity Selector */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-10 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Right: Total and Remove Button */}
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">₦{item.total.toLocaleString()}</p>
                              <button
                                type="button"
                                onClick={() => setOrderItems(orderItems.filter(i => i.id !== item.id))}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                                title="Remove item"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              )}
                </div>

              {/* Right: Order Details */}
                  <div>
                <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type
                  </label>
                  <div className="relative" ref={paymentTypeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowPaymentTypeDropdown(!showPaymentTypeDropdown)}
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-[#02016a] focus:outline-none focus:ring-2 focus:ring-[#02016a] transition-all flex items-center justify-between"
                    >
                      <span className={paymentType ? "text-gray-900" : "text-gray-500"}>
                        {paymentType || "Select Payment Type"}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${showPaymentTypeDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                </button>
                    {showPaymentTypeDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                <button
                          type="button"
                          onClick={() => {
                            setPaymentType("Bank Transfer");
                            setSelectedBank("");
                            setChequeReference("");
                            setChequeNumber("");
                            setChequeAccountName("");
                            setChequeImagePreview(null);
                            setPaymentConfirmed(false);
                            setShowPaymentTypeDropdown(false);
                          }}
                          className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors ${
                            paymentType === "Bank Transfer" ? "bg-[#02016a]/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                            <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
                  </div>
                </button>
                <button
                          type="button"
                          onClick={() => {
                            setPaymentType("Cheque");
                            setSelectedBank("");
                            setPaymentConfirmed(false);
                            setShowPaymentTypeDropdown(false);
                          }}
                          className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors border-t border-gray-100 ${
                            paymentType === "Cheque" ? "bg-[#02016a]/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                            <span className="text-sm font-medium text-gray-900">Cheque</span>
                  </div>
                </button>
                      </div>
                    )}
                  </div>
            </div>

                {/* Bank details for Bank Transfer */}
                {paymentType === "Bank Transfer" && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Details
                    </label>
                    <div className="relative" ref={bankDetailsDropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowBankDetailsDropdown(!showBankDetailsDropdown)}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-[#02016a] focus:outline-none focus:ring-2 focus:ring-[#02016a] transition-all flex items-center justify-between pr-12"
                      >
                        <span className={selectedBank ? "text-gray-900" : "text-gray-500"}>
                          {selectedBank === "gtb"
                            ? "GTBank • 0123456789 • Hencee Pharmaceuticals Ltd"
                            : selectedBank === "access"
                            ? "Access Bank • 1234567890 • Hencee Pharmaceuticals Ltd"
                            : selectedBank === "zenith"
                            ? "Zenith Bank • 9876543210 • Hencee Pharmaceuticals Ltd"
                            : "Select bank account"}
                        </span>
                        <div className="flex items-center gap-2">
                          {selectedBank && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                let accountNumber = "";
                                if (selectedBank === "gtb") accountNumber = "0123456789";
                                if (selectedBank === "access") accountNumber = "1234567890";
                                if (selectedBank === "zenith") accountNumber = "9876543210";
                                if (accountNumber) {
                                  navigator.clipboard
                                    .writeText(accountNumber)
                                    .then(() => {
                                      setCopyToast("Account number has been copied");
                                      setTimeout(() => setCopyToast(null), 2000);
                                    })
                                    .catch(() => undefined);
                                }
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Copy account number"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  let accountNumber = "";
                                  if (selectedBank === "gtb") accountNumber = "0123456789";
                                  if (selectedBank === "access") accountNumber = "1234567890";
                                  if (selectedBank === "zenith") accountNumber = "9876543210";
                                  if (accountNumber) {
                                    navigator.clipboard
                                      .writeText(accountNumber)
                                      .then(() => {
                                        setCopyToast("Account number has been copied");
                                        setTimeout(() => setCopyToast(null), 2000);
                                      })
                                      .catch(() => undefined);
                                  }
                                }
                              }}
                            >
                              <svg
                                className="w-4 h-4 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8z"
                                />
                              </svg>
                            </div>
                          )}
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${showBankDetailsDropdown ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                  </div>
                      </button>
                      {showBankDetailsDropdown && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                      <button
                            type="button"
                            onClick={() => {
                              setSelectedBank("gtb");
                              setShowBankDetailsDropdown(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors ${
                              selectedBank === "gtb" ? "bg-[#02016a]/10" : ""
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">GTBank • 0123456789 • Hencee Pharmaceuticals Ltd</p>
                      </button>
                        <button
                            type="button"
                            onClick={() => {
                              setSelectedBank("access");
                              setShowBankDetailsDropdown(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors border-t border-gray-100 ${
                              selectedBank === "access" ? "bg-[#02016a]/10" : ""
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">Access Bank • 1234567890 • Hencee Pharmaceuticals Ltd</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBank("zenith");
                              setShowBankDetailsDropdown(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors border-t border-gray-100 ${
                              selectedBank === "zenith" ? "bg-[#02016a]/10" : ""
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">Zenith Bank • 9876543210 • Hencee Pharmaceuticals Ltd</p>
                        </button>
                      </div>
                      )}
                    </div>
                    {selectedBank && (
                      <p className="text-xs text-gray-500 mt-1">
                        Please make payment to the selected account.
                      </p>
                    )}
                              </div>
                )}

                {/* Cheque details */}
                {paymentType === "Cheque" && (
                  <div className="space-y-3">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Reference <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                    <input
                      type="text"
                        value={chequeReference}
                        onChange={(e) => setChequeReference(e.target.value)}
                        placeholder="Enter reference (optional)"
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cheque Number
                      </label>
                    <input
                        type="text"
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        placeholder="Enter cheque number"
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                    />
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={chequeAccountName}
                        onChange={(e) => setChequeAccountName(e.target.value)}
                        placeholder="Account name on cheque"
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                      />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Cheque Image
                      </label>
                  <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) {
                            setChequeImagePreview(null);
                            return;
                          }
                          const url = URL.createObjectURL(file);
                          setChequeImagePreview(url);
                        }}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#02016a] file:text-white hover:file:bg-[#03024a]"
                      />
                      {chequeImagePreview && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Preview:
                          </p>
                          <img
                            src={chequeImagePreview}
                            alt="Cheque preview"
                            className="h-24 rounded border border-gray-200 object-contain bg-gray-50"
                  />
                </div>
                      )}
                  </div>
                </div>
              )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
                    <div className="relative" ref={paymentDropdownRef}>
                <button
                        type="button"
                        onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-[#02016a] focus:outline-none focus:ring-2 focus:ring-[#02016a] transition-all flex items-center justify-between"
                      >
                        <span className={payment ? "text-gray-900" : "text-gray-500"}>
                          {payment || "Select Payment"}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${showPaymentDropdown ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                </button>
                      {showPaymentDropdown && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                              <button
                            type="button"
                            onClick={() => {
                              setPayment("Full Payment");
                              setPaymentAmount("");
                              setShowPaymentDropdown(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors ${
                              payment === "Full Payment" ? "bg-[#02016a]/10" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                              <span className="text-sm font-medium text-gray-900">Full Payment</span>
                            </div>
                              </button>
                        <button
                            type="button"
                            onClick={() => {
                              setPayment("Part Payment");
                              setShowPaymentDropdown(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors border-t border-gray-100 ${
                              payment === "Part Payment" ? "bg-[#02016a]/10" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1h-2m2 0h2" />
                              </svg>
                              <span className="text-sm font-medium text-gray-900">Part Payment</span>
                            </div>
                        </button>
            </div>
          )}
                    </div>
                              </div>

                  {payment === "Part Payment" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter payment amount"
                          className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                        />
                              </div>
            </div>
          )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Note (Optional)</label>
                    <textarea
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Add any special instructions..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02016a] resize-none"
                    />
                  </div>

                  {/* Order Total */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-[#02016a]">
                        ₦{calculateTotal().toLocaleString()}
                                </span>
                              </div>
                            </div>

                  {/* Payment Confirmation */}
                  {(paymentType === "Bank Transfer" || paymentType === "Cheque") && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentConfirmed}
                          onChange={(e) => setPaymentConfirmed(e.target.checked)}
                          className="mt-1 w-5 h-5 text-[#02016a] border-gray-300 rounded focus:ring-[#02016a] focus:ring-2"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 block">
                            I confirm that payment has been transferred to the account provided
                          </span>
                          <span className="text-xs text-gray-600 mt-1 block">
                            Please ensure you have completed the payment before confirming
                          </span>
                        </div>
                      </label>
                    </div>
                  )}

                <button
                    onClick={handleCreateOrder}
                    disabled={creatingOrder || orderItems.length === 0 || ((paymentType === "Bank Transfer" || paymentType === "Cheque") && !paymentConfirmed)}
                    className="w-full bg-[#02016a] text-white py-3 rounded-lg font-medium hover:bg-[#03024a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {creatingOrder && (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {creatingOrder ? "Creating Order..." : "Place Order"}
                              </button>

                  {/* Order Invoice */}
                  {orderInvoice && (
                    <div className="mt-6 bg-white rounded-lg shadow-sm border-2 border-[#02016a]">
                      {/* Invoice Header */}
                      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#02016a]/5 to-transparent">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-1">Order Invoice</h3>
                            <p className="text-sm text-gray-600">Invoice Number: {orderInvoice.orderNumber}</p>
                            <p className="text-xs text-gray-500 mt-1">Date: {new Date(orderInvoice.orderDate).toLocaleDateString()}</p>
                          </div>
                  <div className="flex items-center gap-2">
                            <span className="px-3 py-1 text-xs rounded-full font-medium bg-[#02016a] text-white">
                              ORDER
                            </span>
                              <button
                              type="button"
                              onClick={() => setOrderInvoice(null)}
                              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                              aria-label="Close invoice"
                            >
                              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                              </button>
                  </div>
                          </div>
                        </div>

                      {/* Order Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Qty
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unit Price
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {orderInvoice.items.map((item: OrderItem, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                </td>
                                <td className="px-6 py-4 text-center text-sm text-gray-900">
                                  {item.quantity}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-900">
                                  ₦{item.price.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                  ₦{item.total.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>

                      {/* Payment & Total Section */}
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Amount paid:</span>
                            <span className="font-medium text-gray-900">
                              ₦{(typeof orderInvoice.amountPaid === "number" ? orderInvoice.amountPaid : parseFloat(orderInvoice.paymentAmount || "0")).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Payment type:</span>
                            <span className="font-medium text-gray-900">{orderInvoice.paymentType}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Payment details used:</span>
                            <span className="font-medium text-gray-900 text-right max-w-[60%]">
                              {orderInvoice.paymentDetailsUsed ?? orderInvoice.payment ?? "—"}
                            </span>
                          </div>
                          {orderInvoice.orderNote && (
                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Order Note:</p>
                              <p className="text-sm text-gray-700">{orderInvoice.orderNote}</p>
                            </div>
                          )}
                          <div className="pt-2 border-t border-gray-300">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                              <span className="text-2xl font-bold text-[#02016a]">
                                ₦{orderInvoice.totalAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                    </div>
                  </div>
                </div>
              )}

        {/* Exchange and Refunds Tab */}
        {activeTab === "refunds" && (
          <div className="bg-white rounded-xl shadow-sm p-6 min-h-[300px] sm:min-h-[360px] md:min-h-[420px]">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Request Exchange and Refunds</h2>
            
            {orders.length === 0 ? (
                  <div className="text-center py-12">
                <p className="text-gray-600">No orders available for refund/return</p>
                  </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Order
                  </label>
                  <div className="relative" ref={orderDropdownRef}>
                      <button
                      type="button"
                      onClick={() => setShowOrderDropdown(!showOrderDropdown)}
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-[#02016a] focus:outline-none focus:ring-2 focus:ring-[#02016a] transition-all flex items-center justify-between"
                    >
                      <span className={selectedOrderForRefund ? "text-gray-900" : "text-gray-500"}>
                        {selectedOrderForRefund
                          ? (() => {
                              const order = orders.find((o) => o.id === selectedOrderForRefund);
                              return order
                                ? `Order #${order.id.slice(-6)} - ₦${order.totalAmount.toLocaleString()} - ${new Date(order.createdAt).toLocaleDateString()}`
                                : "Select an order...";
                            })()
                          : "Select an order..."}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${showOrderDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                </button>
                    {showOrderDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {orders.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">No orders available</div>
                        ) : (
                          orders.map((order) => (
                <button
                              key={order.id}
                              type="button"
                      onClick={() => {
                                setSelectedOrderForRefund(order.id);
                                setRequestType("");
                                setExchangeSelectedItems([]);
                                setExchangeInvoice(null);
                                setRefundReason("");
                                setSelectedItemsForExchange(new Set());
                                setProductSelectingForExchange(null);
                                setExchangePaymentProof(null);
                                setExchangePaymentProofPreview(null);
                                setExchangeAccountNumber("");
                                setExchangePaymentCompleted(false);
                                setShowOrderDropdown(false);
                              }}
                              className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors border-b border-gray-100 last:border-b-0 ${
                                selectedOrderForRefund === order.id ? "bg-[#02016a]/10" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Order #{order.id.slice(-6)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </p>
                    </div>
                                <p className="text-sm font-semibold text-[#02016a]">
                                  ₦{order.totalAmount.toLocaleString()}
                                </p>
                  </div>
                            </button>
                          ))
                        )}
                </div>
              )}
                  </div>
                </div>

                {selectedOrderForRefund && (
                  <>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request Type
                      </label>
                      <div className="relative" ref={requestTypeDropdownRef}>
                    <button
                          type="button"
                          onClick={() => setShowRequestTypeDropdown(!showRequestTypeDropdown)}
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-[#02016a] focus:outline-none focus:ring-2 focus:ring-[#02016a] transition-all flex items-center justify-between"
                        >
                          <span className={requestType ? "text-gray-900" : "text-gray-500"}>
                            {requestType === "exchange"
                              ? "Exchange Items"
                              : requestType === "refund"
                              ? "Complete Refund"
                              : "Select request type..."}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${showRequestTypeDropdown ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    </button>
                        {showRequestTypeDropdown && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                            <button
                              type="button"
                      onClick={() => {
                                setRequestType("exchange");
                                setExchangeSelectedItems([]);
                                setExchangeInvoice(null);
                                setRefundReason("");
                                setSelectedItemsForExchange(new Set());
                                setProductSelectingForExchange(null);
                                setExchangePaymentProof(null);
                                setExchangePaymentProofPreview(null);
                                setExchangeAccountNumber("");
                                setExchangePaymentCompleted(false);
                                setShowRequestTypeDropdown(false);
                              }}
                              className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors ${
                                requestType === "exchange" ? "bg-[#02016a]/10" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                                <span className="text-sm font-medium text-gray-900">Exchange Items</span>
                  </div>
                </button>
                <button
                              type="button"
                              onClick={() => {
                                setRequestType("refund");
                                setExchangeSelectedItems([]);
                                setExchangeInvoice(null);
                                setRefundReason("");
                                setSelectedItemsForExchange(new Set());
                                setProductSelectingForExchange(null);
                                setShowRequestTypeDropdown(false);
                              }}
                              className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors border-t border-gray-100 ${
                                requestType === "refund" ? "bg-[#02016a]/10" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                                <span className="text-sm font-medium text-gray-900">Complete Refund</span>
                  </div>
                </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {requestType === "exchange" && (
                      <div className="space-y-6">
                        {/* Original Order Items */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Select Items to Exchange</h3>
                          <p className="text-xs text-gray-500 mb-3">Click on items to select them for exchange</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {getSelectedOrder()?.items.map((item, index) => (
                <button
                                key={index}
                                type="button"
                                onClick={() => toggleItemSelection(index)}
                                className={`relative border-2 rounded-xl p-4 transition-all text-left hover:shadow-md ${
                                  selectedItemsForExchange.has(index)
                                    ? "border-[#02016a] bg-[#02016a]/5 shadow-sm"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                {/* Checkmark indicator */}
                                {selectedItemsForExchange.has(index) && (
                                  <div className="absolute top-3 right-3 w-6 h-6 bg-[#02016a] rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-4 h-4 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                    </svg>
                                  </div>
                                )}
                                
                                {/* Selection ring */}
                                {!selectedItemsForExchange.has(index) && (
                                  <div className="absolute top-3 right-3 w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                                )}

                                <div className="pr-8">
                                  <p className="text-sm font-semibold text-gray-900 mb-1">{item.productName}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-gray-500">
                                      Qty: {item.quantity} × ₦{(item.totalPrice / item.quantity).toLocaleString()}
                                    </p>
                                    <p className="text-base font-bold text-[#02016a]">₦{item.totalPrice.toLocaleString()}</p>
                                  </div>
                  </div>
                </button>
                            ))}
                          </div>
            </div>

                        {/* Exchange Product Search */}
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Products to Exchange With
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={exchangeSearchQuery}
                              onChange={(e) => setExchangeSearchQuery(e.target.value)}
                              placeholder="Search for products..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                            />
                            <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                            
                            {showExchangeProductList && exchangeFilteredProducts.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {exchangeFilteredProducts.map((product) => {
                                  const selectedOriginalItems = getSelectedOrder()?.items.filter((_, idx) => selectedItemsForExchange.has(idx)) || [];
                                  
                                  return (
                                    <div
                                      key={product.id}
                                      className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                    >
                                      <div 
                                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => {
                                          if (selectedOriginalItems.length === 1) {
                                            const idx = Array.from(selectedItemsForExchange)[0];
                                            const originalItem = getSelectedOrder()?.items[idx];
                                            if (originalItem) {
                                              addProductToExchange(product, originalItem, idx);
                                            }
                                          } else if (selectedOriginalItems.length > 1) {
                                            setProductSelectingForExchange(
                                              productSelectingForExchange === product.id ? null : product.id
                                            );
                                          }
                                        }}
                                      >
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                                          {product.category && (
                                            <p className="text-xs text-gray-500">
                                              {typeof product.category === 'string' 
                                                ? product.category 
                                                : (product.category as any)?.name || (product.category as any)?.label || ''}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-medium text-gray-900">₦{(product.sellingPrice || product.price || 0).toLocaleString()}</p>
                                          {product.stock !== undefined && (
                                            <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {selectedItemsForExchange.size === 0 ? (
                                        <p className="text-xs text-gray-500 mt-2">Please select items from the order above to exchange</p>
                                      ) : selectedOriginalItems.length === 1 ? (
                                        <p className="text-xs text-[#02016a] mt-2 font-medium">Click to exchange with {selectedOriginalItems[0].productName}</p>
                                      ) : productSelectingForExchange === product.id ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {getSelectedOrder()?.items.map((originalItem, idx) => (
                                            selectedItemsForExchange.has(idx) && (
                    <button
                                                key={idx}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  addProductToExchange(product, originalItem, idx);
                                                  setProductSelectingForExchange(null);
                                                }}
                                                className="text-xs px-2 py-1 bg-[#02016a] text-white rounded hover:bg-[#03024a]"
                                              >
                                                Exchange with {originalItem.productName}
                      </button>
                                            )
                                          ))}
                    </div>
                                      ) : (
                                        <p className="text-xs text-[#02016a] mt-2 font-medium cursor-pointer" onClick={() => setProductSelectingForExchange(product.id)}>
                                          Click to choose which item to exchange with ({selectedOriginalItems.length} selected)
                                        </p>
                                      )}
                  </div>
                                  );
                                })}
                </div>
              )}
                          </div>
                        </div>

                        {/* Selected Exchange Items */}
                        {exchangeSelectedItems.length > 0 && (
                <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Exchange Items</h3>
                            <div className="space-y-3">
                              {exchangeSelectedItems.map((item, index) => {
                                const originalTotal = item.originalItem.totalPrice;
                                const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
                                const difference = newTotal - originalTotal;
                                
                                return (
                                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Original Item</p>
                                        <p className="text-sm font-medium text-gray-900">{item.originalItem.productName}</p>
                                        <p className="text-xs text-gray-600">₦{originalTotal.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1">
                                            <p className="text-xs text-gray-500 mb-1">New Item</p>
                                            <p className="text-sm font-medium text-gray-900">{item.newProduct.name}</p>
                                            <p className="text-xs text-gray-600">₦{(item.newProduct.sellingPrice || item.newProduct.price || 0).toLocaleString()} each</p>
                                          </div>
                    <button
                                            onClick={() => removeExchangeItem(index)}
                                            className="text-red-500 hover:text-red-700 text-sm ml-2"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                        {/* Quantity controls under new product */}
                                        <div className="mt-3">
                                          <p className="text-xs text-gray-500 mb-2">Quantity</p>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => updateExchangeQuantity(index, item.quantity - 1)}
                                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                                            <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                              onClick={() => updateExchangeQuantity(index, item.quantity + 1)}
                                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                        </div>
                                          <p className="text-xs text-gray-600 mt-1">Total: ₦{newTotal.toLocaleString()}</p>
                      </div>
                    </div>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200">
                                      <p className="text-xs text-gray-500">Difference</p>
                                      <p className={`text-sm font-semibold ${difference > 0 ? "text-red-600" : difference < 0 ? "text-green-600" : "text-gray-900"}`}>
                                        {difference > 0 ? "+" : ""}₦{Math.abs(difference).toLocaleString()}
                                        {difference > 0 ? " (You pay)" : difference < 0 ? " (Credit)" : " (Even)"}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                  </div>

                            {/* Total Difference Summary */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Total Difference</span>
                                <span className={`text-lg font-bold ${
                                  exchangeSelectedItems.reduce((sum, item) => {
                                    const originalTotal = item.originalItem.totalPrice;
                                    const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
                                    return sum + (newTotal - originalTotal);
                                  }, 0) > 0 ? "text-red-600" : "text-green-600"
                                }`}>
                                  {(() => {
                                    const totalDiff = exchangeSelectedItems.reduce((sum, item) => {
                                      const originalTotal = item.originalItem.totalPrice;
                                      const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
                                      return sum + (newTotal - originalTotal);
                                    }, 0);
                                    return `${totalDiff > 0 ? "+" : ""}₦${Math.abs(totalDiff).toLocaleString()}`;
                                  })()}
                                </span>
                    </div>
                  </div>
                      </div>
                        )}

                        {/* Instructions */}
                        {exchangeSelectedItems.length > 0 && (() => {
                          const totalDiff = exchangeSelectedItems.reduce((sum, item) => {
                            const originalTotal = item.originalItem.totalPrice;
                            const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
                            return sum + (newTotal - originalTotal);
                          }, 0);
                          
                          return (
                            <div className={`p-4 rounded-lg border-2 ${
                              totalDiff > 0 
                                ? "bg-blue-50 border-blue-200" 
                                : totalDiff < 0 
                                ? "bg-green-50 border-green-200" 
                                : "bg-gray-50 border-gray-200"
                            }`}>
                              <div className="flex items-start gap-3">
                                <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                  totalDiff > 0 ? "text-blue-600" : totalDiff < 0 ? "text-green-600" : "text-gray-600"
                                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                                <div className="flex-1">
                                  <h4 className={`text-sm font-semibold mb-2 ${
                                    totalDiff > 0 ? "text-blue-900" : totalDiff < 0 ? "text-green-900" : "text-gray-900"
                                  }`}>
                                    {totalDiff > 0 
                                      ? "Additional Payment Required" 
                                      : totalDiff < 0 
                                      ? "Credit Refund Available" 
                                      : "Even Exchange"}
                                  </h4>
                                  {totalDiff > 0 && (
                                    <div className="text-sm text-blue-800 space-y-1">
                                      <p>• You need to pay an additional <strong>₦{Math.abs(totalDiff).toLocaleString()}</strong> to complete this exchange.</p>
                                      <p>• Please make payment to the provided account details below.</p>
                                      <p>• Upload proof of payment before submitting your exchange request.</p>
                                      <p>• Your exchange request will only be processed after payment confirmation.</p>
                        </div>
                                  )}
                                  {totalDiff < 0 && (
                                    <div className="text-sm text-green-800 space-y-1">
                                      <p>• You will receive a credit of <strong>₦{Math.abs(totalDiff).toLocaleString()}</strong> for this exchange.</p>
                                      <p>• Please provide your <strong>account number</strong> in the reason field below.</p>
                                      <p>• The account number <strong>must be in your name</strong> (same as your customer account).</p>
                                      <p>• Credit will be refunded to the provided account after exchange approval.</p>
                      </div>
                                  )}
                                  {totalDiff === 0 && (
                                    <p className="text-sm text-gray-700">This is an even exchange with no additional payment or credit required.</p>
                                  )}
                    </div>
                  </div>
                            </div>
                          );
                        })()}

                        {/* Reason for Exchange */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Exchange
                            {(() => {
                              const totalDiff = exchangeSelectedItems.reduce((sum, item) => {
                                const originalTotal = item.originalItem.totalPrice;
                                const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
                                return sum + (newTotal - originalTotal);
                              }, 0);
                              return totalDiff < 0 ? (
                                <span className="text-red-600 ml-1">* (Include your account number)</span>
                              ) : null;
                            })()}
                          </label>
                          <textarea
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder={
                              (() => {
                                const totalDiff = exchangeSelectedItems.reduce((sum, item) => {
                                  const originalTotal = item.originalItem.totalPrice;
                                  const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
                                  return sum + (newTotal - originalTotal);
                                }, 0);
                                return totalDiff < 0 
                                  ? "Please explain why you need to exchange these items...\n\nIMPORTANT: Include your account number here. The account must be in your name (same as your customer account)."
                                  : "Please explain why you need to exchange these items...";
                              })()
                            }
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02016a] resize-none"
                          />
                          {(() => {
                            const totalDiff = exchangeSelectedItems.reduce((sum, item) => {
                              const originalTotal = item.originalItem.totalPrice;
                              const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
                              return sum + (newTotal - originalTotal);
                            }, 0);
                            return totalDiff < 0 && !/\d{10,}/.test(refundReason) && refundReason.length > 20 ? (
                              <p className="text-xs text-red-600 mt-1">⚠️ Please include your account number in the reason field above.</p>
                            ) : null;
                          })()}
                      </div>

                        {/* Exchange Invoice Preview */}
                        {exchangeInvoice && (
                          <div className="bg-white rounded-lg shadow-sm border-2 border-[#02016a]">
                            {/* Invoice Header */}
                            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#02016a]/5 to-transparent">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                                  <h3 className="text-2xl font-semibold text-gray-900 mb-1">Exchange Invoice</h3>
                                  <p className="text-sm text-gray-600">Invoice Number: {exchangeInvoice.orderNumber}</p>
                                  <p className="text-xs text-gray-500 mt-1">Date: {new Date(exchangeInvoice.createdAt).toLocaleDateString()}</p>
                      </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-3 py-1 text-xs rounded-full font-medium bg-[#02016a] text-white">
                                    EXCHANGE
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Original Order Reference */}
                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                      <div>
                                  <p className="text-sm font-medium text-gray-900">Original Order</p>
                                  <p className="text-xs text-gray-600">Order #{exchangeInvoice.originalOrderNumber}</p>
                      </div>
                    </div>
                  </div>

                            {/* Exchange Items Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Original Item
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      New Item
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Qty
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Original Price
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      New Price
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Difference
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {exchangeInvoice.exchangeItems.map((item: any, index: number) => {
                                    const originalTotal = item.originalItem.totalPrice;
                                    const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
                                    const difference = newTotal - originalTotal;
                                    
                                    return (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">{item.originalItem.productName}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.originalItem.quantity}</p>
                </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">{item.newProduct.name}</p>
                                            <p className="text-xs text-gray-500">{item.newProduct.category || "Product"}</p>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-900">
                                          {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                                          ₦{originalTotal.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                                          ₦{newTotal.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                          <span className={`text-sm font-semibold ${
                                            difference > 0 ? "text-red-600" : difference < 0 ? "text-green-600" : "text-gray-900"
                                          }`}>
                                            {difference > 0 ? "+" : ""}₦{Math.abs(difference).toLocaleString()}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Total Section */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                              <div className="flex justify-end">
                                <div className="w-full max-w-md space-y-2">
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>Total Difference:</span>
                                    <span className={`font-semibold ${
                                      exchangeInvoice.totalDifference > 0 ? "text-red-600" : "text-green-600"
                                    }`}>
                                      {exchangeInvoice.totalDifference > 0 ? "+" : ""}₦{Math.abs(exchangeInvoice.totalDifference).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="pt-2 border-t border-gray-300">
                                    <div className="flex justify-between items-center">
                                      <span className="text-lg font-medium text-gray-900">
                                        {exchangeInvoice.totalDifference > 0 ? "Amount to Pay:" : "Credit Amount:"}
                                      </span>
                                      <span className={`text-2xl font-bold ${
                                        exchangeInvoice.totalDifference > 0 ? "text-red-600" : "text-green-600"
                                      }`}>
                                        {exchangeInvoice.totalDifference > 0 ? "+" : ""}₦{Math.abs(exchangeInvoice.totalDifference).toLocaleString()}
                                      </span>
                                    </div>
                                    {exchangeInvoice.totalDifference <= 0 && (
                                      <p className="text-xs text-gray-500 mt-1 text-right">Credit will be applied to your account</p>
                                    )}
                                    {exchangeInvoice.totalDifference > 0 && (
                                      <p className="text-xs text-gray-500 mt-1 text-right">Please complete payment to process exchange</p>
                                    )}
                                  </div>
                                </div>
                              </div>
            </div>
          </div>
          )}

                        {/* Payment Section - Only show when additional payment is required */}
                        {(() => {
                          const totalDiff = exchangeSelectedItems.reduce((sum, item) => {
                            const originalTotal = item.originalItem.totalPrice;
                            const newTotal = (item.newProduct.sellingPrice || item.newProduct.price || 0) * item.quantity;
                            return sum + (newTotal - originalTotal);
                          }, 0);
                          return totalDiff > 0;
                        })() && (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Payment</h3>
                            
                            {/* Bank Account Details */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Account Details</h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                                    <p className="text-sm font-medium text-gray-900">GTBank</p>
                                  </div>
                      <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText("0123456789").then(() => {
                                        setCopyToast("Account number copied!");
                                        setTimeout(() => setCopyToast(null), 2000);
                                      });
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                                    title="Copy account number"
                                  >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                      </button>
                    </div>
                                <div className="p-3 bg-white rounded border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Account Number</p>
                                  <p className="text-sm font-mono font-medium text-gray-900">0123456789</p>
                                </div>
                                <div className="p-3 bg-white rounded border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Account Name</p>
                                  <p className="text-sm font-medium text-gray-900">Hencee Pharmaceuticals Ltd</p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-3">
                                Please make payment to the account above and upload proof of payment below.
                              </p>
      </div>

                            {/* Upload Payment Proof */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Payment Proof <span className="text-red-600">*</span>
                              </label>
                              <div className="mt-1">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setExchangePaymentProof(file);
                                      if (file.type.startsWith("image/")) {
                                        setExchangePaymentProofPreview(URL.createObjectURL(file));
                                      } else {
                                        setExchangePaymentProofPreview(null);
                                      }
                                      setExchangePaymentCompleted(true);
                                    }
                                  }}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#02016a] file:text-white hover:file:bg-[#03024a] file:cursor-pointer"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Upload screenshot or PDF of your payment confirmation
                                </p>
                              </div>
                              
                              {exchangePaymentProofPreview && (
                                <div className="mt-3">
                                  <img
                                    src={exchangePaymentProofPreview}
                                    alt="Payment proof preview"
                                    className="max-w-xs h-auto rounded-lg border border-gray-200"
                                  />
                                </div>
                              )}
                              
                              {exchangePaymentProof && !exchangePaymentProofPreview && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                                    <span className="text-sm text-gray-900">{exchangePaymentProof.name}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Payment Status */}
                            {exchangePaymentCompleted && (
                              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-sm font-medium text-green-800">Payment proof uploaded successfully</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={handleSubmitExchange}
                          disabled={
                            submittingRefund || 
                            !refundReason.trim() || 
                            exchangeSelectedItems.length === 0 ||
                            (exchangeInvoice && exchangeInvoice.totalDifference > 0 && !exchangePaymentCompleted)
                          }
                          className="w-full bg-[#02016a] text-white py-3 rounded-lg font-medium hover:bg-[#03024a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingRefund ? "Submitting..." : "Submit Exchange Request"}
                        </button>
      </div>
                    )}

                    {requestType === "refund" && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Refund
                          </label>
                          <textarea
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="Please explain why you need a refund...\n\nIMPORTANT: Include your account number here for refund. The account must be in your name (same as your customer account)."
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02016a] resize-none"
                          />
                        </div>

                        <button
                          onClick={handleSubmitRefund}
                          disabled={submittingRefund || !refundReason.trim()}
                          className="w-full bg-[#02016a] text-white py-3 rounded-lg font-medium hover:bg-[#03024a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingRefund ? "Submitting..." : "Submit Refund Request"}
                        </button>
                      </div>
                    )}
                  </>
                )}
                  </div>
            )}
                </div>
              )}

        {/* Debt Management Tab */}
        {activeTab === "debt" && (
          <div className="space-y-6">
            {debts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No outstanding balances</p>
                  <p className="text-sm text-gray-500 mt-2">All your orders are fully paid!</p>
                      </div>
                    </div>
                  ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 text-white">
                    <p className="text-xs sm:text-sm md:text-base opacity-90 mb-1 sm:mb-2">Total Outstanding</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold break-words">
                      ₦{debts.reduce((sum, debt) => sum + debt.outstandingBalance, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 text-white">
                    <p className="text-xs sm:text-sm md:text-base opacity-90 mb-1 sm:mb-2">Overdue Amount</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold break-words">
                      ₦{debts
                        .filter(debt => debt.status === "overdue")
                        .reduce((sum, debt) => sum + debt.outstandingBalance, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 text-white">
                    <p className="text-xs sm:text-sm md:text-base opacity-90 mb-1 sm:mb-2">Active Debts</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{debts.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 text-white">
                    <p className="text-xs sm:text-sm md:text-base opacity-90 mb-1 sm:mb-2">Total Paid</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold break-words">
                      ₦{debts.reduce((sum, debt) => sum + debt.paidAmount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Debt List */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-5 md:mb-6">Outstanding Balances</h2>
                  
                    <div className="space-y-4">
                    {debts.map((debt, index) => {
                      const dueDate = new Date(debt.dueDate || debt.orderDate);
                      const isOverdue = dueDate < new Date() && debt.outstandingBalance > 0;
                      const daysOverdue = isOverdue 
                        ? Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      const isHighlighted = highlightedDebtOrderId === debt.orderId;
                      
                      return (
                        <div
                          key={debt.id}
                          ref={(el) => {
                            if (el) {
                              debtCardRefs.current[debt.orderId] = el;
                            }
                          }}
                          className={`border rounded-lg p-3 sm:p-4 md:p-5 hover:shadow-md transition-all duration-300 ease-in-out ${
                            isHighlighted 
                              ? "border-[#02016a] border-2 shadow-lg bg-blue-50" 
                              : "border-gray-200"
                          }`}
                          style={{
                            animation: `fadeIn 0.4s ease-in-out ${index * 0.05}s both`
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg">{debt.orderNumber}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                  debt.status === "overdue"
                                    ? "bg-red-100 text-red-800"
                                    : debt.status === "partial"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}>
                                  {debt.status === "overdue" ? "Overdue" : 
                                   debt.status === "partial" ? "Partial Payment" : 
                                   "Pending"}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 md:mb-3">
                                Order Date: {new Date(debt.orderDate).toLocaleDateString()}
                              </p>
                              <p className={`text-xs sm:text-sm md:text-base mb-2 md:mb-3 break-words ${
                                isOverdue ? "text-red-600 font-medium" : "text-gray-600"
                              }`}>
                                Due Date: {dueDate.toLocaleDateString()}
                                {isOverdue && (
                                  <span className="ml-2">({daysOverdue} days overdue)</span>
                                )}
                              </p>
                              
                              {/* Progress Bar */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>Payment Progress</span>
                                  <span>{Math.round((debt.paidAmount / debt.totalAmount) * 100)}%</span>
                              </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{ width: `${(debt.paidAmount / debt.totalAmount) * 100}%` }}
                                  ></div>
                              </div>
                              </div>

                              {/* Payment History */}
                              {debt.paymentHistory.length > 0 && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                  <p className="font-medium text-gray-700 mb-1">Payment History:</p>
                                  {debt.paymentHistory.map((payment) => (
                                    <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-gray-600">
                                      <span className="break-words">
                                        {new Date(payment.date).toLocaleDateString()} • {payment.method}
                                        {payment.reference && ` • ${payment.reference}`}
                                      </span>
                                      <span className="font-medium text-gray-900">
                                        ₦{payment.amount.toLocaleString()}
                                </span>
                              </div>
                                  ))}
                            </div>
                              )}
                            </div>
                            <div className="text-left sm:text-right sm:ml-4 md:ml-6 flex-shrink-0">
                              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-1 md:mb-2">Total</p>
                              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 break-words">
                                ₦{debt.totalAmount.toLocaleString()}
                              </p>
                              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-1 md:mb-2">Paid</p>
                              <p className="text-xs sm:text-sm md:text-base font-medium text-green-600 mb-2 sm:mb-3 break-words">
                                ₦{debt.paidAmount.toLocaleString()}
                              </p>
                              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-1 md:mb-2">Outstanding</p>
                              <p className={`text-base sm:text-lg md:text-xl font-bold break-words ${
                                debt.status === "overdue" ? "text-red-600" : "text-[#02016a]"
                              }`}>
                                ₦{debt.outstandingBalance.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Make Payment Button */}
                          {debt.outstandingBalance > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={() => setSelectedDebtForPayment(debt)}
                                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                                  debt.status === "overdue"
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "bg-[#02016a] text-white hover:bg-[#03024a]"
                                }`}
                              >
                                {debt.status === "overdue" ? "Pay Now (Overdue)" : "Make Payment"}
                              </button>
                            </div>
                          )}
                          </div>
                      );
                    })}
                        </div>
                    </div>
              </>
                  )}
                </div>
              )}

        {/* Customer Service Tab */}
        {activeTab === "support" && (
          <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6 lg:mb-8">Contact Customer Service</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                <div>
                <h3 className="text-lg lg:text-xl xl:text-2xl font-medium text-gray-900 mb-4 lg:mb-6">Get in Touch</h3>
                <div className="space-y-4 lg:space-y-5">
                  <a
                    href="mailto:henceepharmaceuticals@outlook.com"
                    className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-[#f4f5fa] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                  </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm lg:text-base xl:text-lg">Email</p>
                      <p className="text-sm lg:text-base text-gray-600">henceepharmaceuticals@outlook.com</p>
                    </div>
                  </a>
                  
                  <a
                    href="tel:+2348001234567"
                    className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-[#f4f5fa] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                        </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm lg:text-base xl:text-lg">Phone</p>
                      <p className="text-sm lg:text-base text-gray-600">+234 800 123 4567</p>
                      </div>
                    </a>

                  <a
                    href="https://wa.me/2348001234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-[#25D366] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm lg:text-base xl:text-lg">WhatsApp</p>
                      <p className="text-sm lg:text-base text-gray-600">Chat with us on WhatsApp</p>
                    </div>
                  </a>
                  
                  <div className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 rounded-lg">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-[#f4f5fa] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm lg:text-base xl:text-lg">Business Hours</p>
                      <p className="text-sm lg:text-base text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-sm lg:text-base text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                    </div>
                  </div>
                  </div>
              </div>

              <div>
                <h3 className="text-lg lg:text-xl xl:text-2xl font-medium text-gray-900 mb-4 lg:mb-6">Send us a Message</h3>
                    <div className="space-y-4 lg:space-y-5">
                      <div>
                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2 lg:mb-3">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder="What can we help you with?"
                      className="w-full p-3 lg:p-4 border border-gray-300 rounded-lg text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                    />
                      </div>

                      <div>
                    <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2 lg:mb-3">
                      Message
                    </label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      className="w-full p-3 lg:p-4 border border-gray-300 rounded-lg text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#02016a] resize-none"
                    />
                      </div>

                      <button
                    onClick={handleSubmitSupport}
                    disabled={submittingSupport || !supportSubject.trim() || !supportMessage.trim()}
                    className="w-full bg-[#02016a] text-white py-3 lg:py-4 rounded-lg text-sm lg:text-base font-medium hover:bg-[#03024a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                    {submittingSupport ? "Sending..." : "Send Message"}
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
        </main>

        {selectedOrderForDetails && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] overflow-hidden mx-2 sm:mx-4 md:mx-0">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order Details</p>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{selectedOrderForDetails.id.slice(-6)}
                  </h3>
            </div>
                    <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close order details"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                      </svg>
                    </button>
                  </div>

              {/* Modal Content */}
              <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 overflow-y-auto max-h-[calc(90vh-56px)] sm:max-h-[calc(85vh-56px)] md:max-h-[calc(80vh-56px)] space-y-4">
                {/* Top Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Date</p>
                    <p className="text-gray-900">
                      {new Date(selectedOrderForDetails.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Status</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedOrderForDetails.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : selectedOrderForDetails.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedOrderForDetails.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Payment Status</p>
                    <p className="text-gray-900">
                      {selectedOrderForDetails.paymentStatus}
                    </p>
                  </div>
                </div>

                {/* Amount paid, Payment type, Payment details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-gray-500 mb-1">Amount paid</p>
                    <p className="text-gray-900 font-medium">
                      ₦{(typeof selectedOrderForDetails.paidAmount === "number" ? selectedOrderForDetails.paidAmount : 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Payment type</p>
                    <p className="text-gray-900">
                      {selectedOrderForDetails.paymentType || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Payment details used</p>
                    <p className="text-gray-900 text-right sm:text-left break-words">
                      {selectedOrderForDetails.paymentDetailsUsed || "—"}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mt-2">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-600 font-medium">
                          Item
                        </th>
                        <th className="px-4 py-2 text-center text-gray-600 font-medium">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderForDetails.items.map((item, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-4 py-2 text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-700">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">
                            ₦{item.totalPrice.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Order Total
                    </span>
                    <span className="text-lg font-bold text-[#02016a]">
                      ₦{selectedOrderForDetails.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Partial Payment Info */}
                  {(() => {
                    const hasPartialPayment = selectedOrderForDetails.paymentStatus === "partial" || 
                      (selectedOrderForDetails.paidAmount !== undefined && selectedOrderForDetails.paidAmount > 0 && selectedOrderForDetails.paidAmount < selectedOrderForDetails.totalAmount);
                    const paidAmount = selectedOrderForDetails.paidAmount || 0;
                    const outstandingBalance = hasPartialPayment 
                      ? (selectedOrderForDetails.totalAmount - paidAmount)
                      : 0;
                    
                    if (hasPartialPayment) {
                      return (
                        <>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-700">
                              Amount Paid
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              ₦{paidAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Outstanding Balance
                            </span>
                            <span className="text-lg font-bold text-orange-600">
                              ₦{outstandingBalance.toLocaleString()}
                            </span>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gray-200">
                      <button
                    type="button"
                    onClick={() => setSelectedOrderDetails(null)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  {(() => {
                    const hasPartialPayment = selectedOrderForDetails.paymentStatus === "partial" || 
                      (selectedOrderForDetails.paidAmount !== undefined && selectedOrderForDetails.paidAmount > 0 && selectedOrderForDetails.paidAmount < selectedOrderForDetails.totalAmount);
                    
                    if (hasPartialPayment) {
                      // Find the corresponding debt for this order
                      const correspondingDebt = debts.find(debt => debt.orderId === selectedOrderForDetails.id);
                      
                      return (
                        <button
                          type="button"
                        onClick={() => {
                            if (correspondingDebt) {
                              setSelectedDebtForPayment(correspondingDebt);
                              setSelectedOrderDetails(null);
                            } else {
                              setSelectedOrderDetails(null);
                              setActiveTab("debt");
                              setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }, 100);
                            }
                          }}
                          className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Pay Outstanding Balance
                        </button>
                      );
                    }
                    return null;
                  })()}
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedOrderForDetails) return;
                      setSelectedOrderForRefund(selectedOrderForDetails.id);
                      setActiveTab("refunds");
                      setSelectedOrderDetails(null);
                    }}
                    className="px-3 py-1.5 bg-[#02016a] text-white text-xs font-medium rounded-lg hover:bg-[#03024a] transition-colors"
                  >
                    Request Exchange and Refunds
                      </button>
                </div>
                    </div>
                  </div>
                </div>
              )}

      {/* Clicked Day Orders Modal */}
      {clickedDayOrders && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] overflow-hidden mx-2 sm:mx-4 md:mx-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div>
                <p className="text-xs text-gray-500 mb-1">Orders for Selected Day</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {clickedDayOrders.date}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {clickedDayOrders.orders.length} order{clickedDayOrders.orders.length !== 1 ? 's' : ''} • Total: ₦{clickedDayOrders.totalSpent.toLocaleString()}
                </p>
              </div>
                    <button
                type="button"
                onClick={() => setClickedDayOrders(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close day orders"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                      </svg>
                    </button>
                  </div>

            {/* Modal Content */}
            <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-120px)] md:max-h-[calc(80vh-120px)] space-y-4">
              {clickedDayOrders.orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedOrderDetails(order);
                    setClickedDayOrders(null);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <div className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-700">
                            {item.productName} × {item.quantity} - ₦{(item.totalPrice || 0).toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-[#02016a]">
                        ₦{order.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.paymentStatus}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setClickedDayOrders(null)}
                className="px-4 py-2 bg-[#02016a] text-white text-sm font-medium rounded-lg hover:bg-[#03024a] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Purchase History Modal */}
      {selectedProductHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] overflow-hidden mx-2 sm:mx-4 md:mx-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 mb-1">Purchase History</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedProductHistory.productName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {selectedProductHistory.totalQuantity} items • ₦{selectedProductHistory.totalAmount.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductHistory(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close product history"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                          </svg>
              </button>
                        </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-3">
                {selectedProductHistory.purchases.map((purchase, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm font-medium text-gray-900">
                            Order #{purchase.orderId.slice(-6)}
                          </p>
                      </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(purchase.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-700">
                          Quantity: {purchase.quantity}
                        </p>
                    </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#02016a]">
                          ₦{purchase.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductHistory(null)}
                className="px-4 py-2 bg-[#02016a] text-white text-sm font-medium rounded-lg hover:bg-[#03024a] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt Payment Modal */}
      {selectedDebtForPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden mx-2 sm:mx-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 mb-1">Make Payment</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDebtForPayment.orderNumber}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Outstanding: ₦{selectedDebtForPayment.outstandingBalance.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDebtForPayment(null);
                  setDebtPaymentAmount("");
                  setDebtPaymentType("");
                }}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close payment modal"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                          </svg>
              </button>
                        </div>

            {/* Modal Content */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
              {/* Debt Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₦{selectedDebtForPayment.totalAmount.toLocaleString()}
                  </span>
                      </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="text-sm font-medium text-green-600">
                    ₦{selectedDebtForPayment.paidAmount.toLocaleString()}
                  </span>
                    </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-900">Outstanding Balance:</span>
                  <span className={`text-lg font-bold ${
                    selectedDebtForPayment.status === "overdue" ? "text-red-600" : "text-[#02016a]"
                  }`}>
                    ₦{selectedDebtForPayment.outstandingBalance.toLocaleString()}
                  </span>
                  </div>
              </div>

              {/* Payment Form */}
                    <div className="space-y-4">
                      <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={debtPaymentAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const maxAmount = selectedDebtForPayment.outstandingBalance;
                      if (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= maxAmount)) {
                        setDebtPaymentAmount(value);
                      }
                    }}
                    placeholder="Enter amount to pay"
                    max={selectedDebtForPayment.outstandingBalance}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ₦{selectedDebtForPayment.outstandingBalance.toLocaleString()}
                  </p>
                  {debtPaymentAmount && parseFloat(debtPaymentAmount) > selectedDebtForPayment.outstandingBalance && (
                    <p className="text-xs text-red-600 mt-1">
                      Amount cannot exceed outstanding balance
                    </p>
                  )}
                      </div>

                      <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="relative" ref={debtPaymentTypeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowDebtPaymentTypeDropdown(!showDebtPaymentTypeDropdown)}
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-[#02016a] focus:outline-none focus:ring-2 focus:ring-[#02016a] transition-all flex items-center justify-between"
                    >
                      <span className={debtPaymentType ? "text-gray-900" : "text-gray-500"}>
                        {debtPaymentType || "Select Payment Method"}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${showDebtPaymentTypeDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showDebtPaymentTypeDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setDebtPaymentType("Bank Transfer");
                            setDebtSelectedBank("");
                            setDebtChequeReference("");
                            setDebtChequeNumber("");
                            setDebtChequeAccountName("");
                            setDebtChequeImagePreview(null);
                            setDebtPaymentConfirmed(false);
                            setShowDebtPaymentTypeDropdown(false);
                          }}
                          className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors ${
                            debtPaymentType === "Bank Transfer" ? "bg-[#02016a]/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
                      </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDebtPaymentType("Cheque");
                            setDebtSelectedBank("");
                            setDebtPaymentConfirmed(false);
                            setShowDebtPaymentTypeDropdown(false);
                          }}
                          className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors border-t border-gray-100 ${
                            debtPaymentType === "Cheque" ? "bg-[#02016a]/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-[#02016a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">Cheque</span>
                      </div>
                        </button>
                    </div>
                    )}
                  </div>
                </div>

                {/* Bank details for Bank Transfer */}
                {debtPaymentType === "Bank Transfer" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Details
                    </label>
                    <div className="relative" ref={debtBankDetailsDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowDebtBankDetailsDropdown(!showDebtBankDetailsDropdown)}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-[#02016a] focus:outline-none focus:ring-2 focus:ring-[#02016a] transition-all flex items-center justify-between pr-12"
                      >
                        <span className={debtSelectedBank ? "text-gray-900" : "text-gray-500"}>
                          {debtSelectedBank === "gtb"
                            ? "GTBank • 0123456789 • Hencee Pharmaceuticals Ltd"
                            : debtSelectedBank === "access"
                            ? "Access Bank • 1234567890 • Hencee Pharmaceuticals Ltd"
                            : debtSelectedBank === "zenith"
                            ? "Zenith Bank • 9876543210 • Hencee Pharmaceuticals Ltd"
                            : "Select bank account"}
                        </span>
                        <div className="flex items-center gap-2">
                          {debtSelectedBank && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                let accountNumber = "";
                                if (debtSelectedBank === "gtb") accountNumber = "0123456789";
                                if (debtSelectedBank === "access") accountNumber = "1234567890";
                                if (debtSelectedBank === "zenith") accountNumber = "9876543210";
                                if (accountNumber) {
                                  navigator.clipboard
                                    .writeText(accountNumber)
                                    .then(() => {
                                      setCopyToast("Account number has been copied");
                                      setTimeout(() => setCopyToast(null), 2000);
                                    })
                                    .catch(() => undefined);
                                }
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Copy account number"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  let accountNumber = "";
                                  if (debtSelectedBank === "gtb") accountNumber = "0123456789";
                                  if (debtSelectedBank === "access") accountNumber = "1234567890";
                                  if (debtSelectedBank === "zenith") accountNumber = "9876543210";
                                  if (accountNumber) {
                                    navigator.clipboard
                                      .writeText(accountNumber)
                                      .then(() => {
                                        setCopyToast("Account number has been copied");
                                        setTimeout(() => setCopyToast(null), 2000);
                                      })
                                      .catch(() => undefined);
                                  }
                                }
                              }}
                            >
                              <svg
                                className="w-4 h-4 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                </div>
              )}
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${showDebtBankDetailsDropdown ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
            </div>
                      </button>
                      {showDebtBankDetailsDropdown && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setDebtSelectedBank("gtb");
                              setShowDebtBankDetailsDropdown(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors ${
                              debtSelectedBank === "gtb" ? "bg-[#02016a]/10" : ""
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">GTBank • 0123456789 • Hencee Pharmaceuticals Ltd</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDebtSelectedBank("access");
                              setShowDebtBankDetailsDropdown(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors border-t border-gray-100 ${
                              debtSelectedBank === "access" ? "bg-[#02016a]/10" : ""
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">Access Bank • 1234567890 • Hencee Pharmaceuticals Ltd</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDebtSelectedBank("zenith");
                              setShowDebtBankDetailsDropdown(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#02016a]/5 transition-colors border-t border-gray-100 ${
                              debtSelectedBank === "zenith" ? "bg-[#02016a]/10" : ""
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">Zenith Bank • 9876543210 • Hencee Pharmaceuticals Ltd</p>
                          </button>
          </div>
          )}
      </div>
                    {debtSelectedBank && (
                      <p className="text-xs text-gray-500 mt-1">
                        Please make payment to the selected account.
                      </p>
                    )}
                  </div>
                )}

                {/* Cheque details */}
                {debtPaymentType === "Cheque" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Reference <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={debtChequeReference}
                        onChange={(e) => setDebtChequeReference(e.target.value)}
                        placeholder="Enter payment reference"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cheque Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={debtChequeNumber}
                        onChange={(e) => setDebtChequeNumber(e.target.value)}
                        placeholder="Enter cheque number"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name (on cheque) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={debtChequeAccountName}
                        onChange={(e) => setDebtChequeAccountName(e.target.value)}
                        placeholder="Enter account name as it appears on cheque"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Cheque Image (Optional)
                      </label>
                      <div className="mt-1">
                        {debtChequeImagePreview ? (
                          <div className="relative">
                            <img
                              src={debtChequeImagePreview}
                              alt="Cheque preview"
                              className="w-full h-48 object-contain border border-gray-300 rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setDebtChequeImagePreview(null);
                                if (debtChequeFileInputRef.current) {
                                  debtChequeFileInputRef.current.value = "";
                                }
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                            <input
                              ref={debtChequeFileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setDebtChequeImagePreview(URL.createObjectURL(file));
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Confirmation */}
                {(debtPaymentType === "Bank Transfer" || debtPaymentType === "Cheque") && (
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="debtPaymentConfirmed"
                      checked={debtPaymentConfirmed}
                      onChange={(e) => setDebtPaymentConfirmed(e.target.checked)}
                      className="mt-1 w-4 h-4 text-[#02016a] border-gray-300 rounded focus:ring-[#02016a]"
                    />
                    <label htmlFor="debtPaymentConfirmed" className="text-sm text-gray-700">
                      I confirm that payment has been {debtPaymentType === "Bank Transfer" ? "transferred" : "prepared"} to the account provided
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedDebtForPayment(null);
                  setDebtPaymentAmount("");
                  setDebtPaymentType("");
                  setDebtSelectedBank("");
                  setDebtChequeReference("");
                  setDebtChequeNumber("");
                  setDebtChequeAccountName("");
                  setDebtChequeImagePreview(null);
                  setDebtPaymentConfirmed(false);
                }}
                className="px-4 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!debtPaymentAmount || parseFloat(debtPaymentAmount) <= 0) {
                    showNotification("Please enter a valid payment amount", "error");
                    return;
                  }
                  if (!debtPaymentType) {
                    showNotification("Please select a payment method", "error");
                    return;
                  }
                  if (parseFloat(debtPaymentAmount) > selectedDebtForPayment.outstandingBalance) {
                    showNotification("Payment amount cannot exceed outstanding balance", "error");
                    return;
                  }
                  if (debtPaymentType === "Bank Transfer" && !debtSelectedBank) {
                    showNotification("Please select a bank account", "error");
                    return;
                  }
                  if (debtPaymentType === "Cheque") {
                    if (!debtChequeNumber.trim()) {
                      showNotification("Please enter cheque number", "error");
                      return;
                    }
                    if (!debtChequeAccountName.trim()) {
                      showNotification("Please enter account name on cheque", "error");
                      return;
                    }
                  }
                  if (!debtPaymentConfirmed) {
                    showNotification("Please confirm that payment has been " + (debtPaymentType === "Bank Transfer" ? "transferred" : "prepared") + " to the account provided", "error");
                    return;
                  }

                  try {
                    setSubmittingDebtPayment(true);
                    
                    // Call API to submit debt payment
                    const paymentPayload = {
                      orderId: selectedDebtForPayment.orderId,
                      amount: parseFloat(debtPaymentAmount),
                      paymentMethod: debtPaymentType === "Bank Transfer" ? "TRANSFER" as const : 
                                     debtPaymentType === "Cash" ? "CASH" as const : 
                                     debtPaymentType === "Cheque" ? "CHEQUE" as const : "TRANSFER" as const,
                      reference: debtPaymentType === "Cheque" ? debtChequeNumber : debtChequeReference || undefined,
                      proofImageUrl: debtChequeImagePreview || undefined,
                    };
                    
                    await payDebtAPI(paymentPayload);
                    
                    showNotification(
                      `Payment of ₦${parseFloat(debtPaymentAmount).toLocaleString()} submitted successfully. Your payment will be reviewed and confirmed by our team within 24-48 hours.`,
                      "success"
                    );
                    
                    // Refresh orders to update debt status
                    await refreshOrders();
                    
                    setSelectedDebtForPayment(null);
                    setDebtPaymentAmount("");
                    setDebtPaymentType("");
                    setDebtSelectedBank("");
                    setDebtChequeReference("");
                    setDebtChequeNumber("");
                    setDebtChequeAccountName("");
                    setDebtChequeImagePreview(null);
                    setDebtPaymentConfirmed(false);
                  } catch (err: any) {
                    showNotification("Failed to submit payment. Please try again.", "error");
                  } finally {
                    setSubmittingDebtPayment(false);
                  }
                }}
                disabled={submittingDebtPayment || !debtPaymentAmount || !debtPaymentType || !debtPaymentConfirmed || (debtPaymentType === "Bank Transfer" && !debtSelectedBank) || (debtPaymentType === "Cheque" && (!debtChequeNumber.trim() || !debtChequeAccountName.trim()))}
                className={`px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                  submittingDebtPayment || !debtPaymentAmount || !debtPaymentType || !debtPaymentConfirmed || (debtPaymentType === "Bank Transfer" && !debtSelectedBank) || (debtPaymentType === "Cheque" && (!debtChequeNumber.trim() || !debtChequeAccountName.trim()))
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#02016a] hover:bg-[#03024a]"
                }`}
              >
                {submittingDebtPayment ? "Processing..." : "Submit Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f5fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02016a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
    </div>
      </div>
    }>
      <CustomerPortalContent />
    </Suspense>
  );
}

