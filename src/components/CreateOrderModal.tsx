"use client";

import { useState, useEffect, useCallback } from "react";

import type { CreateSalePayload, SaleUnitType, PaymentMethod, PaymentStatus } from "@/services/sales";
import { getPharmaPresets } from "@/services/pharmaPresets";
import { listCustomers, createCustomer } from "@/services/customers";
import { listProducts } from "@/services/products";
import { CreateCustomerBody } from "@/types/customers";
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { createUser } from "@/services/users";
import { listRoles } from "@/services/permissions";
import { useNotifications } from "@/components/Notification";
import { usePermissions } from "@/hooks/usePermissions";
import { getWarehouses, type Warehouse } from "@/services/warehouses";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateSalePayload) => void;
  initialSaleVariant?: "standard" | "outsourced";
}

interface OrderData {
  customer: string;
  paymentType: string;
  payment: string;
  paymentAmount: string;
  orderNote: string;
  showDiscountOnInvoice: boolean;
  items: OrderItem[];
  saleVariant: "standard" | "outsourced";
  outsourcedSupplierName: string;
  outsourcedItemName: string;
  outsourcedQuantity: string;
  outsourcedCost: string;
  outsourcedSellingPrice: string;
  outsourcedNotes: string;
}

interface OrderItem {
  id: string;
  name: string;
  unitPrice: number;
  price: number;
  quantity: number;
  total: number;
  unitType: SaleUnitType;
  discountAmount: number;
  warehouseNumber?: string;
  warehouseName?: string;
  productSize?: string;
  productSizeUnit?: string;
  /** Per-unit-type prices stored at add time so unit selection can auto-sync price */
  pricePerPiece?: number;
  pricePerCarton?: number;
  pricePerRoll?: number;
  pricePerDozen?: number;
  baseSellingPrice?: number;
}

interface PaymentFormState {
  method: PaymentMethod | "";
  status: PaymentStatus;
  amount: string;
  reference: string;
  senderName: string;
  transactionReference: string;
  chequeNumber: string;
  accountName: string;
  chequeImage?: string; // Image URL for cheque payment evidence
}

interface Product {
  id: string;
  name: string;
  price?: number;
  sellingPrice?: number;
  category?: string | { name?: string; label?: string } | null;
  stock?: number;
  quantity?: number;
  description?: string;
  productSize?: string;
  productSizeUnit?: string;
  warehouseId?: string;
  warehouseName?: string;
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
  balance?: number;
  outstandingBalance?: number;
}

const FALLBACK_UNIT_OPTIONS: SaleUnitType[] = ["piece", "carton", "roll", "dozen"];
const FALLBACK_PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card_and_cash", label: "Card + Cash" },
  { value: "bank_transfer_and_cash", label: "Bank Transfer + Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "mobile_money", label: "Mobile Money" },
];
const FALLBACK_PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function CreateOrderModal({
  isOpen,
  onClose,
  onCreate,
  initialSaleVariant = "standard",
}: CreateOrderModalProps) {
  const [orderData, setOrderData] = useState<OrderData>({
    customer: "",
    paymentType: "",
    payment: "",
    paymentAmount: "",
    orderNote: "",
    showDiscountOnInvoice: true,
    items: [],
    saleVariant: initialSaleVariant,
    outsourcedSupplierName: "",
    outsourcedItemName: "",
    outsourcedQuantity: "1",
    outsourcedCost: "",
    outsourcedSellingPrice: "",
    outsourcedNotes: "",
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
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseMap, setWarehouseMap] = useState<Map<string, string>>(new Map());
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const { user: currentUser } = usePermissions();

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
  const [customerBalance, setCustomerBalance] = useState<number | null>(null);
  /** For card+cash / bank_transfer+cash: how much of the split came as cash */
  const [splitCashAmount, setSplitCashAmount] = useState<string>("");
  const { uploadImage, uploadProgress } = useCloudinaryUpload();
  const { showSuccess, showError } = useNotifications();
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [createAccountForm, setCreateAccountForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; roleType?: string }>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    method: "",
    status: "PENDING",
    amount: "",
    reference: "",
    senderName: "",
    transactionReference: "",
    chequeNumber: "",
    accountName: "",
    chequeImage: undefined,
  });
  const [presetOptions, setPresetOptions] = useState({
    unitTypes: FALLBACK_UNIT_OPTIONS,
    paymentMethods: FALLBACK_PAYMENT_METHOD_OPTIONS,
    paymentStatuses: FALLBACK_PAYMENT_STATUS_OPTIONS,
    showDiscountDefault: true,
  });
  const [appliedPresetDefaults, setAppliedPresetDefaults] = useState(false);
  const formatAmount = (value: number) => `₦${Number(value || 0).toLocaleString()}`;
  const calculateLineTotal = (unitPrice: number, discount: number, quantity: number) => {
    const safeUnit = Number(unitPrice) || 0;
    const safeDiscount = Number(discount) || 0;
    const effectiveUnit = Math.max(safeUnit - safeDiscount, 0);
    return effectiveUnit * Math.max(quantity, 0);
  };
  const unitOptions = presetOptions.unitTypes;
  const paymentMethodOptions = presetOptions.paymentMethods;
  const paymentStatusOptions = presetOptions.paymentStatuses;

  const getPaymentMethodLabel = useCallback(
    (method?: string | null) => {
      if (!method) return "Not set";
      const match = paymentMethodOptions.find((opt) => opt.value === method);
      if (match) return match.label;
      return method
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    },
    [paymentMethodOptions]
  );

  const getPaymentStatusLabel = useCallback(
    (status?: string | null) => {
      if (!status) return "Not set";
      const match = paymentStatusOptions.find((opt) => opt.value === status);
      if (match) return match.label;
      return status
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    },
    [paymentStatusOptions]
  );

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
        const productsArray = await listProducts({ limit: 200, publishedOnly: true });
        
        // Debug: Log the actual structure of the API response
        if (process.env.NODE_ENV === 'development' && productsArray.length > 0) {
          console.log('=== PRODUCTS API RESPONSE DEBUG ===');
          console.log('First product raw data:', productsArray[0]);
          console.log('All product keys:', productsArray[0] ? Object.keys(productsArray[0]) : []);
        }
        
        // Map API response to expected structure
        const mappedProducts = productsArray.map((product: any) => {
          // Try multiple possible field names for dosage
          const productSize = product.productSize || product.dosageSize || product.size || product.strength;
          const productSizeUnit = product.productSizeUnit || product.dosageUnit || product.unit || product.sizeUnit;
          const hasDosage = !!(productSize && productSizeUnit);
          
          // Log dosage availability for ALL products in development mode
          if (process.env.NODE_ENV === 'development' && product.name) {
            console.log(`Product: ${product.name}`, {
              hasDosage,
              productSize: productSize,
              productSizeUnit: productSizeUnit,
              'product.productSize': product.productSize,
              'product.productSizeUnit': product.productSizeUnit,
              rawProduct: product
            });
          }
          
          const inventoryUnits = (product.inventoryUnits ?? {}) as {
            piecesInStock?: number;
            cartonsInStock?: number;
            rollsInStock?: number;
            dozensInStock?: number;
          };
          const normalizedStock =
            Number(inventoryUnits.piecesInStock ?? product.stock ?? product.quantity ?? 0) +
            Number(inventoryUnits.cartonsInStock ?? 0) *
              Number(product.piecesPerCarton ?? 0) +
            Number(inventoryUnits.rollsInStock ?? 0) *
              Number(product.piecesPerRoll ?? 0) +
            Number(inventoryUnits.dozensInStock ?? 0) *
              Number(product.piecesPerDozen ?? 12);

          return {
            id: String(product.id || ''),
            name: String(product.name || 'Unknown Product'),
            price: Number(product.price || product.sellingPrice || 0),
            sellingPrice: Number(product.sellingPrice || product.price || 0),
            pricePerPiece: product.pricePerPiece ? Number(product.pricePerPiece) : undefined,
            pricePerCarton: product.pricePerCarton ? Number(product.pricePerCarton) : undefined,
            pricePerRoll: product.pricePerRoll ? Number(product.pricePerRoll) : undefined,
            pricePerDozen: product.pricePerDozen ? Number(product.pricePerDozen) : undefined,
            category: typeof product.category === 'object' && product.category !== null
              ? ((product.category as any).name || (product.category as any).label || 'General')
              : String(product.category || 'General'),
            stock: normalizedStock,
            quantity: normalizedStock,
            description: String(product.description || ''),
            productSize: productSize ? String(productSize) : undefined,
            productSizeUnit: productSizeUnit ? String(productSizeUnit) : undefined,
            warehouseId: product.warehouseId || product.warehouse?.id || undefined,
            warehouseName: product.warehouseName || product.warehouse?.name || undefined,
          };
        });
        
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

  // Fetch warehouses to map IDs to names
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!isOpen) return;
      
      try {
        const warehousesList = await getWarehouses();
        setWarehouses(warehousesList);
        // Create a map of warehouse ID to name for quick lookup
        const map = new Map<string, string>();
        warehousesList.forEach(warehouse => {
          map.set(warehouse.id, warehouse.name);
        });
        setWarehouseMap(map);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      }
    };

    fetchWarehouses();
  }, [isOpen]);

  // Fetch roles for customer account creation
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesList = await listRoles();
        // Filter for customer-related roles or viewer role
        const customerRoles = rolesList.filter((role: any) => 
          role.roleType?.toLowerCase().includes('customer') || 
          role.roleType?.toLowerCase().includes('viewer') ||
          role.name?.toLowerCase().includes('customer') ||
          role.name?.toLowerCase().includes('viewer')
        );
        if (customerRoles.length > 0) {
          setRoles(customerRoles);
          setSelectedRoleId(customerRoles[0].id);
        } else if (rolesList.length > 0) {
          // Fallback to first role if no customer role found
          setRoles(rolesList);
          setSelectedRoleId(rolesList[0].id);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const fetchPresets = async () => {
      const presets = await getPharmaPresets();
      if (!active) return;

      const normalizeUnitTypes = (input?: unknown): SaleUnitType[] => {
        if (!Array.isArray(input)) return [];
        return input
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.toLowerCase().trim())
          .filter((value): value is SaleUnitType =>
            FALLBACK_UNIT_OPTIONS.includes(value as SaleUnitType)
          );
      };

      const normalizeMethodOptions = (
        input?: unknown
      ): Array<{ value: PaymentMethod; label: string }> => {
        if (!Array.isArray(input)) return [];
        const mapped: Array<{ value: PaymentMethod; label: string }> = [];
        input.forEach((entry) => {
          let rawValue: string | undefined;
          let rawLabel: string | undefined;
          if (typeof entry === "string") {
            rawValue = entry;
          } else if (entry && typeof entry === "object" && "value" in entry) {
            rawValue = String((entry as any).value);
            rawLabel = (entry as any).label ? String((entry as any).label) : undefined;
          }
          if (!rawValue) return;
          const normalized = rawValue.toLowerCase().trim() as PaymentMethod;
          if (FALLBACK_PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === normalized)) {
            mapped.push({
              value: normalized,
              label:
                rawLabel ||
                rawValue
                  .split("_")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" "),
            });
          }
        });
        return mapped;
      };

      const normalizeStatusOptions = (
        input?: unknown
      ): Array<{ value: PaymentStatus; label: string }> => {
        if (!Array.isArray(input)) return [];
        const mapped: Array<{ value: PaymentStatus; label: string }> = [];
        input.forEach((entry) => {
          let rawValue: string | undefined;
          let rawLabel: string | undefined;
          if (typeof entry === "string") {
            rawValue = entry;
          } else if (entry && typeof entry === "object" && "value" in entry) {
            rawValue = String((entry as any).value);
            rawLabel = (entry as any).label ? String((entry as any).label) : undefined;
          }
          if (!rawValue) return;
          const normalized = rawValue.toUpperCase().trim() as PaymentStatus;
          if (FALLBACK_PAYMENT_STATUS_OPTIONS.find((opt) => opt.value === normalized)) {
            mapped.push({
              value: normalized,
              label:
                rawLabel ||
                rawValue
                  .toLowerCase()
                  .split("_")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" "),
            });
          }
        });
        return mapped;
      };

      const unitTypes = normalizeUnitTypes(presets.unitTypes);
      const paymentMethods = normalizeMethodOptions(presets.paymentMethods);
      const paymentStatuses = normalizeStatusOptions(presets.paymentStatuses);
      const showDiscountDefault =
        presets.discountDefaults?.showDiscountOnInvoice ?? true;

      setPresetOptions({
        unitTypes: unitTypes.length ? unitTypes : FALLBACK_UNIT_OPTIONS,
        paymentMethods:
          paymentMethods.length > 0 ? paymentMethods : FALLBACK_PAYMENT_METHOD_OPTIONS,
        paymentStatuses:
          paymentStatuses.length > 0 ? paymentStatuses : FALLBACK_PAYMENT_STATUS_OPTIONS,
        showDiscountDefault,
      });

      if (!appliedPresetDefaults) {
        setOrderData((prev) => ({
          ...prev,
          showDiscountOnInvoice: showDiscountDefault,
        }));
        setAppliedPresetDefaults(true);
      }
    };

    fetchPresets();
    return () => {
      active = false;
    };
  }, [isOpen, appliedPresetDefaults]);

  useEffect(() => {
    if (!isOpen) return;
    setOrderData((prev) => ({
      ...prev,
      saleVariant: initialSaleVariant,
    }));
  }, [initialSaleVariant, isOpen]);

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
    setExplicitCustomerId(customer.id); // Store the customer ID
    setCustomerBalance(
      typeof customer.balance === "number"
        ? customer.balance
        : typeof customer.outstandingBalance === "number"
        ? customer.outstandingBalance
        : null
    );
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

  /** Download the invoice as a PDF-ready HTML file that the browser can Save as PDF */
  const shareInvoiceAsPDF = async () => {
    try {
      const invoiceContent = generateInvoiceHTML();
      const blob = new Blob([invoiceContent], { type: "text/html" });
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      // Try native share API first (mobile / modern browsers)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `${invoiceNumber}.html`, { type: "text/html" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Invoice ${invoiceNumber}`, text: "Invoice from Hencee Pharmaceuticals" });
          return;
        }
      }
      // Fallback: open in new tab with print-to-PDF prompt
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        printWindow.focus();
        // Add a save/print note at the top
        showSuccess("Invoice ready", "In the print dialog, choose 'Save as PDF' to download.");
        setTimeout(() => printWindow.print(), 500);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        showError("Share failed", err?.message || "Could not share invoice");
      }
    }
  };

  // Create customer account
  const handleCreateCustomerAccount = async () => {
    if (!explicitCustomerId && !orderData.customer) {
      showError('Error', 'Please select a customer first');
      return;
    }

    if (!createAccountForm.email || !createAccountForm.password) {
      showError('Error', 'Please fill in email and password');
      return;
    }

    if (createAccountForm.password !== createAccountForm.confirmPassword) {
      showError('Error', 'Passwords do not match');
      return;
    }

    if (!selectedRoleId) {
      showError('Error', 'Please select a role');
      return;
    }

    // Get customer details
    let customerEmail = createAccountForm.email;
    let customerName = orderData.customer;
    let customerPhone = "";

    // Try to get customer details from the selected customer
    if (explicitCustomerId) {
      try {
        const customer = customers.find(c => c.id === explicitCustomerId);
        if (customer) {
          customerName = customer.name;
          customerEmail = customer.email || createAccountForm.email;
          customerPhone = customer.phone || "";
        }
      } catch (error) {
        console.error("Error fetching customer details:", error);
      }
    }

    setCreatingAccount(true);
    try {
      await createUser({
        email: customerEmail,
        name: customerName,
        phone: customerPhone || "0000000000", // Default phone if not available
        password: createAccountForm.password,
        roleId: selectedRoleId,
        isEmailVerified: true // Auto-verify admin-created users to prevent login issues
      });

      showSuccess('Success', 'Customer account created successfully! Login credentials have been set up.');
      setShowCreateAccountModal(false);
      setCreateAccountForm({ email: "", password: "", confirmPassword: "" });
    } catch (error: any) {
      showError('Error', error.message || 'Failed to create customer account');
    } finally {
      setCreatingAccount(false);
    }
  };

  // Generate invoice HTML for printing
  const generateInvoiceHTML = () => {
    const currentDate = new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
    const currentTime = new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const showDiscountColumn = orderData.showDiscountOnInvoice;
    const discountColumnHeader = showDiscountColumn ? "<th>Discount</th>" : "";
    const paymentMethodLabel = getPaymentMethodLabel(paymentForm.method || orderData.paymentType);
    const paymentType = paymentForm.status === "COMPLETED" ? "Full Payment" : "Part Payment";
    const paidAmount = paymentForm.amount
      ? Number(paymentForm.amount)
      : (paymentForm.status === "COMPLETED" ? calculateTotal() : 0);
    const formattedPaymentAmount = formatAmount(paidAmount);
    const outstanding = Math.max(calculateTotal() - paidAmount, 0);
    const saleMadeBy = currentUser
      ? ((currentUser as any).name || `${(currentUser as any).firstName ?? ""} ${(currentUser as any).lastName ?? ""}`.trim() || (currentUser as any).email || "Staff")
      : "Staff";

    // Show bank/split transfer details
    const isBankTransfer = paymentForm.method === "bank_transfer" || paymentForm.method === "bank_transfer_and_cash";
    const bankTransferInfo = isBankTransfer
      ? (() => {
          const parts = [];
          if (paymentForm.senderName && paymentForm.senderName.trim()) {
            parts.push(`<p><strong>Sender Name:</strong> ${paymentForm.senderName}</p>`);
          }
          if (paymentForm.transactionReference && paymentForm.transactionReference.trim()) {
            parts.push(`<p><strong>Transaction Reference:</strong> ${paymentForm.transactionReference}</p>`);
          }
          if (splitCashAmount) {
            parts.push(`<p><strong>Cash Portion:</strong> ${formatAmount(Number(splitCashAmount))}</p>`);
            const cardPortion = Math.max(paidAmount - Number(splitCashAmount), 0);
            parts.push(`<p><strong>Transfer/Card Portion:</strong> ${formatAmount(cardPortion)}</p>`);
          }
          return parts.join('');
        })()
      : '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background-color: #f5f5f5;
            color: #333;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .invoice-header { 
            text-align: center; 
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #02016a;
          }
          .invoice-title { 
            font-size: 36px; 
            font-weight: bold; 
            color: #02016a; 
            margin-bottom: 10px;
            letter-spacing: 2px;
          }
          .invoice-number { 
            font-size: 18px; 
            color: #666;
            font-weight: 500;
          }
          .invoice-details { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 40px;
            gap: 40px;
          }
          .company-info, .customer-info { 
            flex: 1;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
          }
          .company-info h3, .customer-info h3 { 
            margin: 0 0 15px 0; 
            color: #02016a;
            font-size: 18px;
            border-bottom: 2px solid #02016a;
            padding-bottom: 8px;
          }
          .company-info p, .customer-info p { 
            margin: 8px 0; 
            color: #555;
            font-size: 14px;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .items-table th, .items-table td { 
            padding: 15px; 
            text-align: left; 
            border-bottom: 1px solid #e0e0e0;
          }
          .items-table th { 
            background-color: #02016a;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
          }
          .items-table td {
            background-color: #fff;
          }
          .items-table tbody tr:hover {
            background-color: #f8f9fa;
          }
          .total-section { 
            text-align: right; 
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .total-amount { 
            font-size: 28px; 
            font-weight: bold; 
            color: #02016a;
          }
          .payment-info {
            margin-top: 20px;
            padding: 15px;
            background: #e8f4f8;
            border-left: 4px solid #02016a;
            border-radius: 4px;
          }
          .payment-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            color: #666; 
            font-size: 12px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .notes-section {
            margin-top: 30px;
            padding: 15px;
            background: #fff9e6;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
          }
          .notes-section h3 {
            margin-bottom: 10px;
            color: #333;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">Invoice #${invoiceNumber}</div>
          </div>
          
          <div class="invoice-details">
            <div class="company-info">
              <h3>Hencee Pharmaceuticals</h3>
              <p>12 Pharmaceutical Avenue, Victoria Island</p>
              <p>Lagos, Nigeria</p>
              <p>Phone: +234 901 234 5678</p>
              <p>Email: info@henceepharmaceuticals.com</p>
            </div>
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${orderData.customer || 'Customer Name'}</strong></p>
              <p>Date: ${currentDate}</p>
              <p>Time: ${currentTime}</p>
              <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
              <p><strong>Sale Made By:</strong> ${saleMadeBy}</p>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Warehouse</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                ${discountColumnHeader}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map(item => {
                const unitLabel = item.unitType ? item.unitType.charAt(0).toUpperCase() + item.unitType.slice(1) + (item.quantity !== 1 ? 's' : '') : '';
                return `
                <tr>
                  <td>
                    <strong>${item.name}</strong>
                    ${item.productSize && item.productSizeUnit ? `<br><span style="font-size: 0.85em; color: #666;">${item.productSize} ${item.productSizeUnit}</span>` : ''}
                  </td>
                  <td>${item.warehouseName || item.warehouseNumber || 'N/A'}</td>
                  <td>${item.quantity}${unitLabel ? ` <span style="font-size:0.85em;color:#555;">${unitLabel}</span>` : ''}</td>
                  <td>${formatAmount(item.unitPrice)}</td>
                  ${showDiscountColumn ? `<td>${formatAmount(item.discountAmount || 0)}</td>` : ''}
                  <td><strong>${formatAmount(item.total)}</strong></td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-amount">Total: ₦${calculateTotal().toLocaleString()}</div>
          </div>
          
          <div class="payment-info">
            <p><strong>Payment Method:</strong> ${paymentMethodLabel}</p>
            <p><strong>Payment Type:</strong> ${paymentType}</p>
            <p><strong>Amount Paid:</strong> ${formattedPaymentAmount}</p>
            ${outstanding > 0 ? `<p style="color:#b45309;font-weight:bold;"><strong>Outstanding Balance:</strong> ${formatAmount(outstanding)}</p>` : '<p style="color:#15803d;font-weight:bold;">Fully Paid ✓</p>'}
            ${bankTransferInfo}
          </div>
          
          ${orderData.orderNote ? `
            <div class="notes-section">
              <h3>Notes:</h3>
              <p>${orderData.orderNote}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>Generated on ${currentDate} at ${currentTime}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Add product to order
  const addProductToOrder = (product: Product) => {
    const existingItem = orderData.items.find(item => item.id === product.id);
    const productPrice = product.sellingPrice || product.price || 0;
    const defaultUnitType: SaleUnitType = "piece";
    
    if (existingItem) {
      const updatedItems = orderData.items.map(item =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              total: calculateLineTotal(item.unitPrice, item.discountAmount, item.quantity + 1),
            }
          : item
      );
      setOrderData(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Get warehouse name from product or warehouse map
      let warehouseName = product.warehouseName;
      if (!warehouseName && product.warehouseId) {
        warehouseName = warehouseMap.get(product.warehouseId);
      }
      
      const prod = product as unknown as Record<string, unknown>;
      const newItem: OrderItem = {
        id: product.id,
        name: product.name,
        unitPrice: productPrice,
        price: productPrice,
        quantity: 1,
        total: calculateLineTotal(productPrice, 0, 1),
        unitType: defaultUnitType,
        discountAmount: 0,
        productSize: product.productSize,
        productSizeUnit: product.productSizeUnit,
        warehouseNumber: product.warehouseId,
        warehouseName: warehouseName,
        pricePerPiece: Number(prod.pricePerPiece ?? productPrice) || productPrice,
        pricePerCarton: prod.pricePerCarton ? Number(prod.pricePerCarton) : undefined,
        pricePerRoll: prod.pricePerRoll ? Number(prod.pricePerRoll) : undefined,
        pricePerDozen: prod.pricePerDozen ? Number(prod.pricePerDozen) : undefined,
        baseSellingPrice: productPrice,
      };
      setOrderData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }
    
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
        ? {
            ...item,
            quantity: newQuantity,
            total: calculateLineTotal(item.unitPrice, item.discountAmount, newQuantity),
          }
        : item
    );
    setOrderData(prev => ({ ...prev, items: updatedItems }));
  };

  const updateItemUnitType = (productId: string, unitType: SaleUnitType) => {
    const updatedItems = orderData.items.map(item => {
      if (item.id === productId) {
        let newPrice = item.unitPrice;
        if (unitType === "piece") {
          newPrice = item.pricePerPiece ?? item.baseSellingPrice ?? item.unitPrice;
        } else if (unitType === "carton") {
          newPrice = item.pricePerCarton ?? item.unitPrice;
        } else if (unitType === "roll") {
          newPrice = item.pricePerRoll ?? item.unitPrice;
        } else if (unitType === "dozen") {
          newPrice = item.pricePerDozen ?? item.unitPrice;
        }
        return {
          ...item,
          unitType,
          unitPrice: newPrice,
          price: newPrice,
          total: calculateLineTotal(newPrice, item.discountAmount, item.quantity),
        };
      }
      return item;
    });
    setOrderData(prev => ({ ...prev, items: updatedItems }));
  };

  const updateItemUnitPrice = (productId: string, newPrice: number) => {
    const updatedItems = orderData.items.map(item =>
      item.id === productId
        ? {
            ...item,
            unitPrice: newPrice,
            price: newPrice,
            total: calculateLineTotal(newPrice, item.discountAmount, item.quantity),
          }
        : item
    );
    setOrderData(prev => ({ ...prev, items: updatedItems }));
  };

  const updateItemDiscountAmount = (productId: string, newDiscount: number) => {
    const updatedItems = orderData.items.map(item =>
      item.id === productId
        ? {
            ...item,
            discountAmount: newDiscount,
            total: calculateLineTotal(item.unitPrice, newDiscount, item.quantity),
          }
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
    if (orderData.saleVariant === "outsourced" && orderData.items.length === 0) {
      const qty = Math.max(Number(orderData.outsourcedQuantity || 0), 0);
      const unitSelling = Math.max(Number(orderData.outsourcedSellingPrice || 0), 0);
      return qty * unitSelling;
    }
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

      // Validate that we have a customer ID
      if (!customerId) {
        throw new Error('Customer ID is required. Please select a customer or create a new one.');
      }

      const salePayload: CreateSalePayload = {
        customerId,
        items: orderData.items.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitType: item.unitType,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount || 0,
        })),
        notes: orderData.orderNote || undefined,
        showDiscountOnInvoice: orderData.showDiscountOnInvoice,
        saleVariant: orderData.saleVariant,
      };

      if (orderData.saleVariant === "outsourced") {
        const supplier = orderData.outsourcedSupplierName.trim();
        const itemName = orderData.outsourcedItemName.trim();
        const quantity = Number(orderData.outsourcedQuantity);
        const cost = Number(orderData.outsourcedCost);
        const selling = Number(orderData.outsourcedSellingPrice);
        if (!supplier) {
          throw new Error("Outsourced sale requires supplier name.");
        }
        if (!itemName) {
          throw new Error("Outsourced sale requires goods/item name.");
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("Outsourced sale requires a valid quantity greater than zero.");
        }
        if (!Number.isFinite(cost) || cost < 0) {
          throw new Error("Outsourced sale requires a valid source cost.");
        }
        if (!Number.isFinite(selling) || selling <= 0) {
          throw new Error("Outsourced sale requires a valid selling price.");
        }
        // Ensure outsourced goods always become a visible line item in the order.
        salePayload.items = [
          {
            productId: `outsourced-${Date.now()}`,
            productName: itemName,
            quantity,
            unitType: "piece",
            unitPrice: selling,
            discountAmount: 0,
          },
        ];
        salePayload.outsourcedSupplierName = supplier;
        salePayload.outsourcedCost = cost;
        salePayload.outsourcedSellingPrice = selling;
        salePayload.outsourcedNotes =
          [itemName, orderData.outsourcedNotes.trim()].filter(Boolean).join(" | ") || undefined;
      }

      const legacyMethodMap: Record<string, PaymentMethod> = {
        Cash: "cash",
        Card: "card",
        "Bank Transfer": "bank_transfer",
        Cheque: "cheque",
        "Mobile Money": "mobile_money",
      };

      const derivedMethod =
        paymentForm.method || legacyMethodMap[orderData.paymentType] || "";
      const derivedStatus: PaymentStatus =
        paymentForm.status ||
        (orderData.payment === "Full Payment" ? "COMPLETED" : "PENDING");
      const derivedAmountString = paymentForm.amount || orderData.paymentAmount;
      const parsedAmount =
        derivedAmountString && !Number.isNaN(Number(derivedAmountString))
          ? Number(derivedAmountString)
          : undefined;

      if (
        derivedMethod &&
        derivedStatus === "COMPLETED" &&
        (!parsedAmount || parsedAmount <= 0)
      ) {
        throw new Error("Please enter the amount received when marking the payment as completed.");
      }

      if (derivedMethod) {
        const cashPortion = splitCashAmount ? Number(splitCashAmount) : undefined;
        salePayload.payment = {
          method: derivedMethod as PaymentMethod,
          status: derivedStatus,
          amount: parsedAmount,
          reference: paymentForm.reference || undefined,
          senderName: paymentForm.senderName || undefined,
          transactionReference: paymentForm.transactionReference || undefined,
          chequeNumber: paymentForm.chequeNumber || undefined,
          accountName: paymentForm.accountName || undefined,
          ...(cashPortion !== undefined && { cashPortion }),
        };
      }

      onCreate(salePayload);
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={shareInvoiceAsPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share PDF
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Hencee Pharmaceuticals</h3>
                    <p className="text-gray-600">123 Business Street</p>
                    <p className="text-gray-600">Lagos, Nigeria</p>
                    <p className="text-gray-600">Phone: +234 800 123 4567</p>
                    <p className="text-gray-600">Email: henceepharmaceuticals@outlook.com</p>
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                    <p className="text-gray-600 font-medium">{orderData.customer || 'Customer Name'}</p>
                    <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-gray-600">Time: {new Date().toLocaleTimeString()}</p>
                    <p className="text-gray-600">Payment Method: {getPaymentMethodLabel(paymentForm.method || orderData.paymentType)}</p>
                    <p className="text-gray-600">Payment Status: {getPaymentStatusLabel(paymentForm.status)}</p>
                    <p className="text-gray-600">Amount: {paymentForm.amount && paymentForm.amount.trim() !== '' ? formatAmount(Number(paymentForm.amount)) : formatAmount(calculateTotal())}</p>
                    {paymentForm.method === "bank_transfer" && (
                      <>
                        {paymentForm.senderName && paymentForm.senderName.trim() && (
                          <p className="text-gray-600">Sender Name: {paymentForm.senderName}</p>
                        )}
                        {paymentForm.transactionReference && paymentForm.transactionReference.trim() && (
                          <p className="text-gray-600">Transaction Reference: {paymentForm.transactionReference}</p>
                        )}
                      </>
                    )}
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
                          {orderData.showDiscountOnInvoice && (
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Discount</th>
                          )}
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.productSize && item.productSizeUnit && (
                                <div className="text-xs text-gray-500 mt-1">{item.productSize} {item.productSizeUnit}</div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.warehouseName || item.warehouseNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.quantity}</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-700">{formatAmount(item.unitPrice)}</td>
                            {orderData.showDiscountOnInvoice && (
                              <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                {formatAmount(item.discountAmount || 0)}
                              </td>
                            )}
                            <td className="border border-gray-300 px-4 py-3 text-gray-700">{formatAmount(item.total)}</td>
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
                        // Clear customer ID when manually typing
                        if (e.target.value !== orderData.customer) {
                          setExplicitCustomerId("");
                          setCustomerBalance(null);
                        }
                      }}
                      onFocus={() => setShowCustomerList(true)}
                      placeholder="Search customers..."
                      className="customer-input w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                    />
                    <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {customerBalance !== null && (
                    <p className="mt-2 text-sm text-[#8b8d97]">
                      Current outstanding balance:{" "}
                      <span className="font-semibold text-[#02016a]">
                        {formatAmount(customerBalance)}
                      </span>
                    </p>
                  )}
                  
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

              {/* Payment Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[14px] text-[#45464e] mb-2">Payment Method</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        method: e.target.value as PaymentMethod,
                        senderName: e.target.value === "bank_transfer" ? prev.senderName : "",
                        transactionReference:
                          e.target.value === "bank_transfer" ? prev.transactionReference : "",
                        chequeNumber: e.target.value === "cheque" ? prev.chequeNumber : "",
                        accountName: e.target.value === "cheque" ? prev.accountName : "",
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                  >
                    <option value="">Select method</option>
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer outstanding balance notice */}
                {customerBalance !== null && customerBalance > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[13px] font-semibold text-amber-900">
                      Existing outstanding balance: ₦{customerBalance.toLocaleString()}
                    </p>
                    <p className="text-[12px] text-amber-700 mt-0.5">
                      This balance is carried over from previous unpaid orders.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[14px] text-[#45464e] mb-2">Payment Type</label>
                  <select
                      value={paymentForm.status}
                      onChange={(e) => {
                        const st = e.target.value as PaymentStatus;
                        setPaymentForm((prev) => ({
                          ...prev,
                          status: st,
                          // Auto-fill amount to full total for Full Payment
                          amount: st === "COMPLETED" ? String(calculateTotal()) : prev.amount,
                        }));
                      }}
                    className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                  >
                    <option value="PENDING">Part Payment</option>
                    <option value="COMPLETED">Full Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] text-[#45464e] mb-2">Amount Paid (₦)</label>
                  <div className="relative">
                    <input
                      type="number"
                        min="0"
                        value={paymentForm.amount}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        placeholder={paymentForm.status === "COMPLETED" ? String(calculateTotal()) : "Amount received"}
                      className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent pl-8"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-[14px]">₦</span>
                  </div>
                  {(() => {
                    const total = calculateTotal();
                    const paid = Number(paymentForm.amount) || (paymentForm.status === "COMPLETED" ? total : 0);
                    const outstanding = Math.max(total - paid, 0);
                    return outstanding > 0 ? (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        Outstanding balance: ₦{outstanding.toLocaleString()}
                      </p>
                    ) : paid >= total && total > 0 ? (
                      <p className="text-xs text-green-600 mt-1 font-medium">Fully paid ✓</p>
                    ) : null;
                  })()}
                  </div>
                </div>

                {/* Split-payment cash portion for card+cash and bank_transfer+cash */}
                {(paymentForm.method === "card_and_cash" || paymentForm.method === "bank_transfer_and_cash") && (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 space-y-3">
                    <p className="text-[13px] font-medium text-indigo-900">
                      Split Payment Breakdown
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] text-[#45464e] mb-1">
                          {paymentForm.method === "card_and_cash" ? "Card" : "Bank Transfer"} Amount (₦)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={
                              paymentForm.amount && splitCashAmount
                                ? String(Math.max(Number(paymentForm.amount) - Number(splitCashAmount), 0))
                                : paymentForm.amount
                            }
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-lg text-[13px] bg-white text-[#45464e] pl-6"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[12px]">₦</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[12px] text-[#45464e] mb-1">Cash Amount (₦)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={splitCashAmount}
                            onChange={(e) => setSplitCashAmount(e.target.value)}
                            placeholder="Cash portion"
                            className="w-full p-2 border border-gray-300 rounded-lg text-[13px] text-[#45464e] pl-6 focus:outline-none focus:ring-2 focus:ring-[#02016a]"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[12px]">₦</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[14px] text-[#45464e] mb-2">Payment Reference</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    placeholder="Enter reference (optional)"
                    className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                  />
                </div>

                {(paymentForm.method === "bank_transfer" || paymentForm.method === "bank_transfer_and_cash") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">Sender Name</label>
                      <input
                        type="text"
                        value={paymentForm.senderName}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            senderName: e.target.value,
                          }))
                        }
                        placeholder="Name on originating account"
                        className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">Transaction Reference</label>
                      <input
                        type="text"
                        value={paymentForm.transactionReference}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            transactionReference: e.target.value,
                          }))
                        }
                        placeholder="e.g. BANK123456"
                        className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                </div>
              )}

                {paymentForm.method === "cheque" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">Cheque Number</label>
                      <input
                        type="text"
                        value={paymentForm.chequeNumber}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            chequeNumber: e.target.value,
                          }))
                        }
                        placeholder="Enter cheque number"
                        className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">Account Name</label>
                      <input
                        type="text"
                        value={paymentForm.accountName}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            accountName: e.target.value,
                          }))
                        }
                        placeholder="Account name on cheque"
                        className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
                {paymentForm.method === "cheque" && (
                  <div className="mt-4">
                    <label className="block text-[14px] text-[#45464e] mb-2">Cheque Image Evidence</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const result = await uploadImage(file, { folder: 'cheque-payments' });
                              setPaymentForm((prev) => ({
                                ...prev,
                                chequeImage: result.secure_url,
                              }));
                            } catch (error: any) {
                              console.error('Failed to upload cheque image:', error);
                            }
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {paymentForm.chequeImage && (
                        <div className="relative">
                          <img src={paymentForm.chequeImage} alt="Cheque evidence" className="h-20 w-20 object-cover rounded-lg border border-gray-300" />
                          <button
                            type="button"
                            onClick={() => setPaymentForm((prev) => ({ ...prev, chequeImage: undefined }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    {uploadProgress.isUploading && (
                      <p className="mt-1 text-xs text-gray-500">Uploading... {uploadProgress.progress}%</p>
                    )}
                  </div>
                )}
              </div>

              {/* Show Discount on Invoice */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  id="show-discount-checkbox"
                  type="checkbox"
                  checked={orderData.showDiscountOnInvoice}
                  onChange={(e) =>
                    setOrderData((prev) => ({
                      ...prev,
                      showDiscountOnInvoice: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 text-[#02016a] border-gray-300 rounded focus:ring-[#02016a]"
                />
                <div>
                  <label htmlFor="show-discount-checkbox" className="text-[14px] font-medium text-[#45464e]">
                    Show discount on invoice
                  </label>
                  <p className="text-[12px] text-[#8b8d97]">
                    Disable this if you want to hide per-line discount information on the printed invoice.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-[13px] font-medium text-blue-900">
                  Order date and time are set automatically at submission.
                </p>
                <p className="text-[12px] text-blue-800 mt-1">
                  Recorded from server time for reconciliation accuracy.
                </p>
              </div>

              <div>
                <label className="block text-[14px] text-[#45464e] mb-2">Sale Type</label>
                <select
                  value={orderData.saleVariant}
                  onChange={(e) =>
                    setOrderData((prev) => ({
                      ...prev,
                      saleVariant: e.target.value as "standard" | "outsourced",
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                >
                  <option value="standard">Standard Stock Sale</option>
                  <option value="outsourced">Outsourced Goods Sale</option>
                </select>
              </div>

              {orderData.saleVariant === "outsourced" && (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <label className="block text-[14px] text-[#45464e] mb-2">Supplier Name</label>
                    <input
                      type="text"
                      value={orderData.outsourcedSupplierName}
                      onChange={(e) =>
                        setOrderData((prev) => ({
                          ...prev,
                          outsourcedSupplierName: e.target.value,
                        }))
                      }
                      placeholder="Supplier for outsourced goods"
                      className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">Outsourced Goods Name</label>
                      <input
                        type="text"
                        value={orderData.outsourcedItemName}
                        onChange={(e) =>
                          setOrderData((prev) => ({
                            ...prev,
                            outsourcedItemName: e.target.value,
                          }))
                        }
                        placeholder="e.g. Augmentin 625mg"
                        className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={orderData.outsourcedQuantity}
                        onChange={(e) =>
                          setOrderData((prev) => ({
                            ...prev,
                            outsourcedQuantity: e.target.value,
                          }))
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">Source Cost</label>
                      <input
                        type="number"
                        min="0"
                        value={orderData.outsourcedCost}
                        onChange={(e) =>
                          setOrderData((prev) => ({
                            ...prev,
                            outsourcedCost: e.target.value,
                          }))
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] text-[#45464e] mb-2">Selling Price</label>
                      <input
                        type="number"
                        min="0"
                        value={orderData.outsourcedSellingPrice}
                        onChange={(e) =>
                          setOrderData((prev) => ({
                            ...prev,
                            outsourcedSellingPrice: e.target.value,
                          }))
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[14px] text-[#45464e] mb-2">Outsourced Notes</label>
                    <textarea
                      rows={2}
                      value={orderData.outsourcedNotes}
                      onChange={(e) =>
                        setOrderData((prev) => ({
                          ...prev,
                          outsourcedNotes: e.target.value,
                        }))
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}

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
                      // Handle category as object or string
                      let productCategory = '';
                      if (product.category) {
                        if (typeof product.category === 'object' && product.category !== null) {
                          const categoryObj = product.category as { name?: string; label?: string };
                          productCategory = categoryObj.name || categoryObj.label || '';
                        } else {
                          productCategory = String(product.category);
                        }
                      }
                      
                      return (
                        <div
                          key={String(product.id || '')}
                      onClick={() => addProductToOrder(product)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                              <h4 className="text-[14px] font-medium text-[#45464e]">{productName}</h4>
                              {product.productSize && product.productSizeUnit ? (
                                <p className="text-[12px] text-[#8b8d97] font-medium">
                                  {product.productSize} {product.productSizeUnit}
                                </p>
                              ) : null}
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
                          {item.productSize && item.productSizeUnit ? (
                            <p className="text-[12px] text-[#8b8d97] mb-1">
                              {item.productSize} {item.productSizeUnit}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic mb-1">No dosage information</p>
                          )}
                          <p className="text-[12px] text-[#8b8d97]">{formatAmount(item.unitPrice)} per unit</p>
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
                          <p className="text-[14px] font-semibold text-[#45464e]">{formatAmount(item.total)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <div>
                          <label className="block text-[12px] text-[#8b8d97] mb-1">Unit Type</label>
                          <select
                            value={item.unitType}
                            onChange={(e) =>
                              updateItemUnitType(item.id, e.target.value as SaleUnitType)
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg text-[13px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                          >
                            {unitOptions.map((option) => (
                              <option key={option} value={option}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[12px] text-[#8b8d97] mb-1">Unit Price</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItemUnitPrice(item.id, Number(e.target.value) || 0)
                              }
                              className="w-full p-2 border border-gray-300 rounded-lg text-[13px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent pl-7"
                            />
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                              ₦
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[12px] text-[#8b8d97] mb-1">Discount / Unit</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={item.discountAmount}
                              onChange={(e) =>
                                updateItemDiscountAmount(item.id, Number(e.target.value) || 0)
                              }
                              className="w-full p-2 border border-gray-300 rounded-lg text-[13px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent pl-7"
                            />
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                              ₦
                            </span>
                          </div>
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
            <button
              onClick={shareInvoiceAsPDF}
              disabled={orderData.items.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-[14px] hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share PDF
            </button>
            <button
              onClick={() => setShowCreateAccountModal(true)}
              disabled={!explicitCustomerId && !orderData.customer}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-[14px] hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Customer Account
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

      {/* Create Customer Account Modal */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create Customer Account</h2>
              <button
                onClick={() => {
                  setShowCreateAccountModal(false);
                  setCreateAccountForm({ email: "", password: "", confirmPassword: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  {orderData.customer || 'No customer selected'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createAccountForm.email}
                  onChange={(e) => setCreateAccountForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="customer@example.com"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createAccountForm.password}
                  onChange={(e) => setCreateAccountForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createAccountForm.confirmPassword}
                  onChange={(e) => setCreateAccountForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm password"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                />
              </div>

              {roles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name || role.roleType || 'Unknown Role'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleCreateCustomerAccount}
                  disabled={creatingAccount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingAccount ? 'Creating Account...' : 'Create Account'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateAccountModal(false);
                    setCreateAccountForm({ email: "", password: "", confirmPassword: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </>
  );
}
