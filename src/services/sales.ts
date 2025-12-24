import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";
// @ts-ignore - jsPDF types may not be available
import jsPDF from "jspdf";

export type SaleUnitType = "piece" | "carton" | "roll" | "dozen";
export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "cheque"
  | "mobile_money";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface SaleItemPayload {
  productId: string;
  quantity: number;
  unitType?: SaleUnitType;
  unitPrice?: number;
  discountAmount?: number;
}

export interface SalePaymentPayload {
  method?: PaymentMethod;
  status?: PaymentStatus;
  amount?: number;
  reference?: string;
  senderName?: string;
  transactionReference?: string;
  chequeNumber?: string;
  accountName?: string;
}

export interface CreateSalePayload {
  customerId: string;
  items: SaleItemPayload[];
  payment?: SalePaymentPayload;
  notes?: string;
  showDiscountOnInvoice?: boolean;
}

export interface SalePayment
  extends Omit<SalePaymentPayload, "method" | "status" | "amount"> {
  id: string;
  method?: PaymentMethod | string;
  status: PaymentStatus;
  amount: number;
  reference?: string;
  senderName?: string;
  transactionReference?: string;
  chequeNumber?: string;
  accountName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalTrailEntry {
  action: "APPROVE" | "QUERY" | "REJECT" | "STATUS_UPDATE" | string;
  role?: string;
  status?: PaymentStatus | string;
  amountPaid?: number;
  note?: string;
  timestamp?: string;
  performedBy?: string;
}

export interface SaleMetadata {
  discountTotal?: number;
  outstandingAfter?: number;
  outstandingDelta?: number;
  approvalTrail?: ApprovalTrailEntry[];
  [key: string]: any;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedUnit?: SaleUnitType;
  originalPrice?: number;
  discountAmount?: number;
  product?: {
    id: string;
    name: string;
    sku?: string;
    pricePerPiece?: number;
    pricePerCarton?: number;
    pricePerRoll?: number;
    piecesPerCarton?: number;
    piecesPerRoll?: number;
    image?: string;
  };
}

export interface Sale {
  id: string;
  customerId: string;
  customerName?: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  items: SaleItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | string;
  status?: string;
  isOutsourced?: boolean;
  outstandingBalance?: number;
  showDiscountOnInvoice?: boolean;
  notes?: string;
  metadata?: SaleMetadata;
  payments?: SalePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesDashboardResponse {
  summary: {
    allOrders: number;
    pending: number;
    completed: number;
    canceled: number;
    returned: number;
    damaged: number;
    abandonedCart: number;
    customers: number;
  };
  orders: Array<{
    id: string;
    customerName: string;
    orderDate: string;
    orderType: string;
    trackingId: string;
    orderTotal: string;
    status: string;
    statusColor?: string;
    paymentStatus?: PaymentStatus;
    outstandingBalance?: number;
    action?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface SalesListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface UpdateSaleStatusPayload {
  status: PaymentStatus;
  amountPaid?: number;
}

export interface ApproveSalePayload {
  amountPaid: number;
  note?: string;
}

export interface QuerySalePayload {
  note: string;
}

export interface RejectSalePayload {
  note: string;
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

export async function fetchSalesDashboard(
  params: SalesListParams = {}
): Promise<SalesDashboardResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.search) queryParams.set("search", params.search);
  if (params.status) queryParams.set("status", params.status);
  if (params.dateFrom) queryParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) queryParams.set("dateTo", params.dateTo);
  if (params.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params.sortDir) queryParams.set("sortDir", params.sortDir);
  const url = `${API_ENDPOINTS.salesDashboard}${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;
    const response = await authFetch(url);
  return parseJson<SalesDashboardResponse>(response);
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
    const response = await authFetch(API_ENDPOINTS.sales, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseJson<Sale>(response);
}

export async function getSaleById(id: string): Promise<Sale> {
    const response = await authFetch(API_ENDPOINTS.saleById(id));
  return parseJson<Sale>(response);
}

export async function updateSaleStatus(
  id: string,
  payload: UpdateSaleStatusPayload
): Promise<Sale> {
    const response = await authFetch(API_ENDPOINTS.saleStatus(id), {
    method: "PUT",
      headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseJson<Sale>(response);
}

export async function addSalePayment(
  saleId: string,
  payload: SalePaymentPayload
): Promise<SalePayment> {
  const response = await authFetch(API_ENDPOINTS.salePayments(saleId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseJson<SalePayment>(response);
}

// Helper function to generate PDF from invoice JSON data
function generatePDFFromInvoiceData(invoiceData: any): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;
  const margin = 20;
  const lineHeight = 7;
  
  // Helper function to format currency
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(2, 1, 106); // #02016a
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  const invoiceNumber = `Invoice #${invoiceData.saleId?.substring(0, 8).toUpperCase() || 'N/A'}`;
  doc.text(invoiceNumber, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  // Company Info (Left)
  doc.setFontSize(14);
  doc.setTextColor(2, 1, 106);
  doc.setFont(undefined, 'bold');
  doc.text('Ceeone Wheels', margin, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'normal');
  doc.text('123 Business Street', margin, yPos);
  yPos += lineHeight;
  doc.text('Lagos, Nigeria', margin, yPos);
  yPos += lineHeight;
  doc.text('Phone: +234 800 123 4567', margin, yPos);
  yPos += lineHeight;
  doc.text('Email: info@ceeonewheels.com', margin, yPos);
  
  // Customer Info (Right)
  yPos = 35;
  doc.setFontSize(14);
  doc.setTextColor(2, 1, 106);
  doc.setFont(undefined, 'bold');
  doc.text('Bill To:', pageWidth - margin, yPos, { align: 'right' });
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'normal');
  if (invoiceData.customer) {
    doc.text(invoiceData.customer.name || 'Customer Name', pageWidth - margin, yPos, { align: 'right' });
    yPos += lineHeight;
    if (invoiceData.customer.email) {
      doc.text(invoiceData.customer.email, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight;
    }
    if (invoiceData.customer.phone) {
      doc.text(invoiceData.customer.phone, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight;
    }
    if (invoiceData.customer.address) {
      doc.text(invoiceData.customer.address, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight;
    }
  }
  
  if (invoiceData.issuedAt) {
    doc.text(`Date: ${formatDate(invoiceData.issuedAt)}`, pageWidth - margin, yPos, { align: 'right' });
  }
  
  // Items Table
  yPos = 80;
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(2, 1, 106);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
  
  doc.text('Item', margin + 2, yPos);
  doc.text('Qty', margin + 80, yPos);
  doc.text('Unit Price', margin + 100, yPos);
  if (invoiceData.showDiscountOnInvoice) {
    doc.text('Discount', margin + 140, yPos);
    doc.text('Total', pageWidth - margin - 2, yPos, { align: 'right' });
  } else {
    doc.text('Total', pageWidth - margin - 2, yPos, { align: 'right' });
  }
  
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;
  
  // Items
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  
  if (invoiceData.items && Array.isArray(invoiceData.items)) {
    invoiceData.items.forEach((item: any) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont(undefined, 'bold');
      doc.text(item.productName || 'Product', margin + 2, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(String(item.quantity || 0), margin + 80, yPos);
      doc.text(formatCurrency(item.unitPrice || 0), margin + 100, yPos);
      
      if (invoiceData.showDiscountOnInvoice) {
        doc.text(formatCurrency(item.discountAmount || 0), margin + 140, yPos);
      }
      
      doc.setFont(undefined, 'bold');
      doc.text(formatCurrency(item.totalPrice || 0), pageWidth - margin - 2, yPos, { align: 'right' });
      doc.setFont(undefined, 'normal');
      
      yPos += 8;
    });
  }
  
  // Totals
  yPos += 5;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  if (invoiceData.totals) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    
    if (invoiceData.showDiscountOnInvoice && invoiceData.totals.discount) {
      doc.text('Subtotal:', pageWidth - margin - 60, yPos, { align: 'right' });
      doc.text(formatCurrency(invoiceData.totals.subtotal || 0), pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 8;
      
      doc.text('Discount:', pageWidth - margin - 60, yPos, { align: 'right' });
      doc.text(formatCurrency(invoiceData.totals.discount || 0), pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 8;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(2, 1, 106);
    doc.text('Total:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(formatCurrency(invoiceData.totals.total || 0), pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += 10;
    
    if (invoiceData.totals.paid !== undefined) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.text('Amount Paid:', pageWidth - margin - 60, yPos, { align: 'right' });
      doc.text(formatCurrency(invoiceData.totals.paid || 0), pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 8;
    }
    
    if (invoiceData.totals.outstanding !== undefined) {
      doc.text('Outstanding:', pageWidth - margin - 60, yPos, { align: 'right' });
      doc.text(formatCurrency(invoiceData.totals.outstanding || 0), pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += 8;
    }
  }
  
  // Payment Summary
  if (invoiceData.paymentSummary && Array.isArray(invoiceData.paymentSummary) && invoiceData.paymentSummary.length > 0) {
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(2, 1, 106);
    doc.text('Payment Information:', margin, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    invoiceData.paymentSummary.forEach((payment: any) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      
      const method = payment.method || 'N/A';
      const status = payment.status || 'N/A';
      doc.text(`Method: ${method} | Status: ${status} | Amount: ${formatCurrency(payment.amount || 0)}`, margin, yPos);
      if (payment.reference) {
        yPos += 6;
        doc.text(`Reference: ${payment.reference}`, margin + 5, yPos);
      }
      yPos += 8;
    });
    
    // Bank transfer transaction reference if available
    if (invoiceData.paymentSummary.some((p: any) => p.method === 'BANK_TRANSFER' && p.transactionReference)) {
      const bankTransfer = invoiceData.paymentSummary.find((p: any) => p.method === 'BANK_TRANSFER');
      if (bankTransfer?.transactionReference) {
        doc.text(`Transaction Reference: ${bankTransfer.transactionReference}`, margin, yPos);
        yPos += 8;
      }
    }
  }
  
  // Notes
  if (invoiceData.notes) {
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', margin, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');
    const notesLines = doc.splitTextToSize(invoiceData.notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPos);
  }
  
  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', pageWidth / 2, footerY - 5, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: 'center' });
  
  // Generate blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

export async function downloadSaleInvoice(
  saleId: string,
  variant: "standard" | "outsourced" = "standard"
): Promise<Blob> {
  // Try with format=pdf parameter first
  let url = API_ENDPOINTS.saleInvoice(saleId, variant);
  const urlObj = new URL(url);
  urlObj.searchParams.set('format', 'pdf');
  url = urlObj.toString();
  
  // Get token manually to avoid authFetch's default Content-Type header
  let token: string | null = null;
  if (typeof window !== "undefined") {
    try { 
      token = localStorage.getItem("accessToken") || localStorage.getItem("authToken"); 
    } catch { 
      token = null; 
    }
  }
  
  // Make request directly with fetch to avoid Content-Type: application/json header
  // which interferes with PDF downloads
  // Add Accept header to request PDF format explicitly
  const headers: HeadersInit = {
    'Accept': 'application/pdf, application/octet-stream, */*',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  
  // Handle 401 - redirect to login
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized. Please log in to continue.");
  }
  
  if (response.status === 403) {
    throw new Error("Forbidden. You do not have permission to download this invoice.");
  }
  
  // Check content type FIRST - even if status is 200, JSON means backend returned data instead of PDF
  const contentType = response.headers.get('content-type') || '';
  
  // If response is JSON, the backend is returning invoice data, not a PDF
  // Generate PDF client-side from the JSON data
  if (contentType.includes('application/json') || contentType.includes('text/json')) {
    try {
      const invoiceData = await response.json();
      
      // Check if it's actually an error message
      if (invoiceData?.message || invoiceData?.error) {
        throw new Error(invoiceData.message || invoiceData.error);
      }
      
      // Generate PDF from invoice data
      try {
        const pdfBlob = generatePDFFromInvoiceData(invoiceData);
        return pdfBlob;
      } catch (pdfError: any) {
        console.error('Error generating PDF:', pdfError);
        throw new Error(`Failed to generate PDF: ${pdfError.message}`);
      }
    } catch (e: any) {
      // If it's already our error, throw it
      if (e.message && (e.message.includes('Failed to generate') || e.message.includes('Server error'))) {
        throw e;
      }
      // If JSON parsing failed, try text
      const textResponse = response.clone();
      const text = await textResponse.text();
      throw new Error(`Server returned JSON instead of PDF: ${text.substring(0, 300)}`);
    }
  }
  
  // Check if response is ok
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = "Failed to download invoice";
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        errorMessage = data?.message || data?.error || errorMessage;
      } else {
        // Try to read as text first
        const text = await response.text();
        if (text) {
          // Check if it's JSON
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData?.message || errorData?.error || errorMessage;
          } catch {
            errorMessage = text.substring(0, 200);
          }
        }
      }
    } catch (e) {
      // If we can't parse error, use default message
      console.error('Error parsing error response:', e);
    }
    throw new Error(errorMessage);
  }
  
  // Clone the response before reading (we might need to read it multiple times)
  const responseClone = response.clone();
  
  // Read the blob from the cloned response
  const blob = await responseClone.blob();
  
  // Verify blob is not empty
  if (blob.size === 0) {
    throw new Error("Received empty PDF file");
  }
  
  // Check if blob appears to be a PDF by reading first bytes
  const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const pdfSignature = String.fromCharCode(...uint8Array);
  
  // PDF files start with %PDF
  if (!pdfSignature.startsWith('%PDF')) {
    // Might be HTML error page or JSON error
    const textBlob = blob.slice(0, 500); // Only read first 500 bytes for error checking
    const text = await textBlob.text();
    if (text.trim().startsWith('<') || text.trim().startsWith('{')) {
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData?.message || errorData?.error || "Server returned error instead of PDF");
      } catch {
        throw new Error("Server returned invalid response. Expected PDF but received: " + text.substring(0, 100));
      }
    }
    console.warn('PDF signature check failed. First bytes:', pdfSignature, 'Content-Type:', contentType);
    // Don't throw here - some PDFs might have different headers, but still be valid
  }
  
  // Return blob with explicit PDF type
  return new Blob([blob], { type: 'application/pdf' });
}

export async function approveSalePayment(
  saleId: string,
  payload: ApproveSalePayload
): Promise<Sale> {
  const response = await authFetch(API_ENDPOINTS.saleApprove(saleId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseJson<Sale>(response);
}

export async function querySalePayment(
  saleId: string,
  payload: QuerySalePayload
): Promise<Sale> {
  const response = await authFetch(API_ENDPOINTS.saleQuery(saleId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseJson<Sale>(response);
}

export async function rejectSalePayment(
  saleId: string,
  payload: RejectSalePayload
): Promise<Sale> {
  const response = await authFetch(API_ENDPOINTS.saleReject(saleId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseJson<Sale>(response);
}

export async function getSalesByCustomer(customerId: string): Promise<Sale[]> {
    const response = await authFetch(API_ENDPOINTS.salesByCustomer(customerId));
  return parseJson<Sale[]>(response);
}

export async function getSalesByDateRange(
  dateFrom: string,
  dateTo: string
): Promise<Sale[]> {
  const queryParams = new URLSearchParams({ dateFrom, dateTo });
    const url = `${API_ENDPOINTS.salesDateRange}?${queryParams.toString()}`;
    const response = await authFetch(url);
  return parseJson<Sale[]>(response);
}

export async function getSalesWithPendingPayments(): Promise<Sale[]> {
    const response = await authFetch(API_ENDPOINTS.salesPendingPayments);
  return parseJson<Sale[]>(response);
}

export async function searchSales(query: string): Promise<Sale[]> {
    const queryParams = new URLSearchParams({ search: query });
    const url = `${API_ENDPOINTS.salesSearch}?${queryParams.toString()}`;
    const response = await authFetch(url);
  return parseJson<Sale[]>(response);
}

export async function getDailySales(date: string): Promise<Sale[]> {
    const response = await authFetch(API_ENDPOINTS.salesDaily(date));
  return parseJson<Sale[]>(response);
}

export async function getMonthlySalesReport(): Promise<any> {
    const response = await authFetch(API_ENDPOINTS.salesMonthlyReport);
  return parseJson<any>(response);
}