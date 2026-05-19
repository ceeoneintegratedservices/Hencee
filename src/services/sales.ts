import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";
// @ts-ignore - jsPDF types may not be available
import jsPDF from "jspdf";

export type SaleUnitType = "piece" | "carton" | "roll" | "dozen";
export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "cheque"
  | "mobile_money"
  | "card_and_cash"
  | "bank_transfer_and_cash";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface SaleItemPayload {
  productId: string;
  productName?: string;
  quantity: number;
  unitType?: SaleUnitType;
  unitPrice?: number;
  discountAmount?: number;
  isOutsourced?: boolean;
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
  saleVariant?: "standard" | "outsourced";
  outsourcedSupplierName?: string;
  outsourcedCost?: number;
  outsourcedSellingPrice?: number;
  outsourcedNotes?: string;
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
  productSize?: string;
  productSizeUnit?: string;
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
    phone?: string;
  };
  homeAddress?: string;
  billingAddress?: string;
  orderNumber?: string;
  trackingId?: string;
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

function computeSaleTotal(items: SaleItemPayload[]): number {
  return items.reduce((sum, i) => {
    const line =
      (i.unitPrice ?? 0) * i.quantity - (i.discountAmount ?? 0);
    return sum + line;
  }, 0);
}

function derivePaymentStatus(o: Record<string, unknown>): PaymentStatus {
  const pay = String(o.payment ?? "").toLowerCase();
  const st = String(o.status ?? "").toUpperCase();
  const outstanding = Number(o.outstandingBalance ?? (o.metadata as Record<string, unknown> | undefined)?.outstandingBalance ?? 0);
  if (!Number.isNaN(outstanding) && outstanding <= 0) return "COMPLETED";
  if (pay.includes("part")) return "PENDING";
  if (pay.includes("unpaid")) return "PENDING";
  if (st.includes("COMPLET") || pay === "paid") return "COMPLETED";
  if (st.includes("FAIL")) return "FAILED";
  if (st.includes("REFUND")) return "REFUNDED";
  return "PENDING";
}

function normalizeSaleItems(raw: unknown): SaleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((it: Record<string, unknown>, i: number) => ({
    id: String(it.id ?? `line-${i}`),
    productId: String(it.productId ?? ""),
    productName: String(it.productName ?? it.name ?? "Product"),
    quantity: Number(it.quantity ?? 0),
    unitPrice: Number(it.unitPrice ?? it.price ?? 0),
    totalPrice: Number(
      it.totalPrice ??
        it.orderTotal ??
        Number(it.quantity ?? 0) * Number(it.unitPrice ?? it.price ?? 0)
    ),
    selectedUnit: it.selectedUnit as SaleItem["selectedUnit"],
    originalPrice: it.originalPrice as number | undefined,
    discountAmount: it.discountAmount as number | undefined,
    product: it.product as SaleItem["product"],
    productSize: it.productSize as string | undefined,
    productSizeUnit: it.productSizeUnit as string | undefined,
  }));
}

/** Maps Convex `sales.formatOrder` payload to the legacy `Sale` shape. */
export function convexOrderToSale(o: Record<string, unknown>): Sale {
  const meta = (o.metadata as SaleMetadata | undefined) ?? {};
  const cust = o.customer as
    | { id?: string; name?: string; email?: string; phone?: string }
    | undefined;
  return {
    id: String(o.id),
    customerId: String(o.customerId ?? cust?.id ?? ""),
    customerName: cust?.name,
    customer: {
      id: cust?.id,
      name: cust?.name,
      email: cust?.email,
      phone: cust?.phone,
    },
    homeAddress: o.homeAddress as string | undefined,
    billingAddress: o.billingAddress as string | undefined,
    orderNumber: o.orderNumber as string | undefined,
    trackingId: o.trackingId as string | undefined,
    items: normalizeSaleItems(o.items),
    totalAmount: Number(o.totalAmount ?? 0),
    paymentStatus: derivePaymentStatus(o),
    paymentMethod: o.paymentMethod as Sale["paymentMethod"],
    status: String(o.status),
    isOutsourced: Boolean(o.isOutsourced ?? o.saleVariant === "outsourced"),
    outstandingBalance: Number(
      o.outstandingBalance ??
        (meta as { outstandingBalance?: number }).outstandingBalance ??
        0
    ),
    notes:
      typeof meta.notes === "string"
        ? meta.notes
        : (meta as { notes?: string }).notes,
    showDiscountOnInvoice: meta.showDiscountOnInvoice as boolean | undefined,
    metadata: meta,
    payments: [],
    createdAt: String(o.createdAt),
    updatedAt: String(o.updatedAt),
  };
}

export async function fetchSalesDashboard(
  params: SalesListParams = {}
): Promise<SalesDashboardResponse> {
  const raw = await getConvexClient().query(api.sales.ordersDashboard, {
    page: params.page,
    limit: params.limit,
    search: params.search,
    status: params.status,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  });
  return {
    ...raw,
    orders: (raw.orders ?? []).map((o) => ({
      ...o,
      id: String(o.id),
      paymentStatus:
        o.paymentStatus === "COMPLETED" ||
        o.paymentStatus === "FAILED" ||
        o.paymentStatus === "REFUNDED"
          ? (o.paymentStatus as PaymentStatus)
          : "PENDING",
    })),
  };
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  const totalAmount = computeSaleTotal(payload.items ?? []);
  const created = await getConvexClient().mutation(api.sales.create, {
    customerId: payload.customerId as Id<"customers">,
    items: payload.items,
    totalAmount,
    saleVariant: payload.saleVariant,
    outsourcedSupplierName: payload.outsourcedSupplierName,
    outsourcedCost: payload.outsourcedCost,
    outsourcedSellingPrice: payload.outsourcedSellingPrice,
    outsourcedNotes: payload.outsourcedNotes,
    paymentMethod: payload.payment?.method,
    metadata: {
      notes: payload.notes,
      showDiscountOnInvoice: payload.showDiscountOnInvoice,
      payment: payload.payment,
    },
  });
  return convexOrderToSale(created as unknown as Record<string, unknown>);
}

export async function getSaleById(id: string): Promise<Sale> {
  const o = await getConvexClient().query(api.sales.getById, {
    id: id as Id<"sales">,
  });
  return convexOrderToSale(o as unknown as Record<string, unknown>);
}

export async function updateSaleStatus(
  id: string,
  payload: UpdateSaleStatusPayload
): Promise<Sale> {
  const updated = await getConvexClient().mutation(api.sales.updateStatus, {
    id: id as Id<"sales">,
    status: String(payload.status),
  });
  return convexOrderToSale(updated as unknown as Record<string, unknown>);
}

export async function addSalePayment(
  saleId: string,
  payload: SalePaymentPayload
): Promise<SalePayment> {
  const order = await getConvexClient().query(api.sales.getById, {
    id: saleId as Id<"sales">,
  });
  const customerId = (order as { customerId: Id<"customers"> }).customerId;
  const paymentId = await getConvexClient().mutation(api.payments.create, {
    saleId: saleId as Id<"sales">,
    customerId,
    amount: payload.amount ?? 0,
    method: payload.method,
    status: payload.status ?? "PENDING",
    reference: payload.reference,
  });
  const row = await getConvexClient().query(api.payments.get, {
    id: paymentId as Id<"payments">,
  });
  const p = row as {
    _id: Id<"payments">;
    method?: string;
    status: string;
    amount: number;
    reference?: string;
    createdAt: number;
    updatedAt: number;
  };
  return {
    id: p._id,
    method: p.method as PaymentMethod,
    status: p.status as PaymentStatus,
    amount: p.amount,
    reference: p.reference,
    senderName: payload.senderName,
    transactionReference: payload.transactionReference,
    chequeNumber: payload.chequeNumber,
    accountName: payload.accountName,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
  };
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
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const invoiceNumber = `Invoice #${invoiceData.saleId?.substring(0, 8).toUpperCase() || 'N/A'}`;
  doc.text(invoiceNumber, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  // Company Info (Left)
  doc.setFontSize(14);
  doc.setTextColor(2, 1, 106);
  doc.setFont('helvetica', 'bold');
  doc.text('Hencee Pharmaceuticals', margin, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Business Street', margin, yPos);
  yPos += lineHeight;
  doc.text('Lagos, Nigeria', margin, yPos);
  yPos += lineHeight;
  doc.text('Phone: +234 800 123 4567', margin, yPos);
  yPos += lineHeight;
  doc.text('Email: henceepharmaceuticals@outlook.com', margin, yPos);
  
  // Customer Info (Right)
  yPos = 35;
  doc.setFontSize(14);
  doc.setTextColor(2, 1, 106);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', pageWidth - margin, yPos, { align: 'right' });
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
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

  // Warehouse (when present at invoice or first-item level)
  const warehouseObj = invoiceData.warehouse && typeof invoiceData.warehouse === 'object'
    ? invoiceData.warehouse
    : invoiceData.items?.[0]?.warehouse;
  const warehouseName =
    invoiceData.warehouseName ||
    (typeof invoiceData.warehouse === 'string' ? invoiceData.warehouse : invoiceData.warehouse?.name) ||
    (invoiceData.items?.[0]?.warehouseName || (invoiceData.items?.[0]?.warehouse && (typeof invoiceData.items[0].warehouse === 'string' ? invoiceData.items[0].warehouse : invoiceData.items[0].warehouse?.name)));
  const warehouseAddress = warehouseObj?.address || null;
  if (warehouseName) {
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(`Warehouse: ${warehouseName}`, pageWidth - margin, yPos, { align: 'right' });
    if (warehouseAddress) {
      yPos += lineHeight;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(warehouseAddress, pageWidth - margin, yPos, { align: 'right' });
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
    }
  }

  // Items Table
  yPos = 85;
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(2, 1, 106);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
  
  doc.text('Item', margin + 2, yPos);
  doc.text('Warehouse', margin + 52, yPos);
  doc.text('Qty', margin + 82, yPos);
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
      
      const itemWarehouseName =
        item.warehouseName ||
        (typeof item.warehouse === 'string' ? item.warehouse : item.warehouse?.name) ||
        warehouseName ||
        '—';
      const itemWarehouseAddress = item.warehouse && typeof item.warehouse === 'object' ? item.warehouse?.address : null;
      
      doc.setFont('helvetica', 'bold');
      doc.text(item.productName || 'Product', margin + 2, yPos);
      doc.setFont('helvetica', 'normal');
      
      // Add dosage size below product name if available
      if (item.productSize && item.productSizeUnit) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`${item.productSize} ${item.productSizeUnit}`, margin + 2, yPos + 4);
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
      }
      
      doc.text(itemWarehouseName, margin + 52, yPos);
      if (itemWarehouseAddress) {
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(itemWarehouseAddress, margin + 52, yPos + 4);
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
      }
      doc.text(String(item.quantity || 0), margin + 82, yPos);
      doc.text(formatCurrency(item.unitPrice || 0), margin + 100, yPos);
      
      if (invoiceData.showDiscountOnInvoice) {
        doc.text(formatCurrency(item.discountAmount || 0), margin + 140, yPos);
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(item.totalPrice || 0), pageWidth - margin - 2, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      
      // Increase yPos: extra line for dosage size and/or warehouse address
      let rowHeight = 8;
      if (item.productSize && item.productSizeUnit) rowHeight = 10;
      if (itemWarehouseAddress) rowHeight = Math.max(rowHeight, 12);
      yPos += rowHeight;
    });
  }
  
  // Totals
  yPos += 5;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  if (invoiceData.totals) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
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
      doc.setFont('helvetica', 'normal');
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
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 1, 106);
    doc.text('Payment Information:', margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    invoiceData.paymentSummary.forEach((payment: any) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      
      const method = payment.method || 'N/A';
      const status = payment.status || 'N/A';
      doc.text(`Method: ${method} | Status: ${status} | Amount: ${formatCurrency(payment.amount || 0)}`, margin, yPos);
      yPos += 6;
      
      // Show reference if available
      if (payment.reference) {
        doc.text(`Reference: ${payment.reference}`, margin + 5, yPos);
        yPos += 6;
      }
    
      // Show bank transfer specific details
      if (method === 'BANK_TRANSFER' || method === 'bank_transfer') {
        if (payment.senderName) {
          doc.text(`Sender Name: ${payment.senderName}`, margin + 5, yPos);
          yPos += 6;
        }
        if (payment.transactionReference) {
          doc.text(`Transaction Reference: ${payment.transactionReference}`, margin + 5, yPos);
          yPos += 6;
      }
    }
      
      yPos += 4; // Extra spacing between payments
    });
  }
  
  // Notes
  if (invoiceData.notes) {
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
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
  void variant;
  const order = await getConvexClient().query(api.sales.getById, {
    id: saleId as Id<"sales">,
  });
  const o = order as Record<string, unknown>;
  const sale = convexOrderToSale(o);
  const cust = o.customer as
    | { name?: string; email?: string; phone?: string }
    | undefined;
  const invoiceData = {
    saleId,
    issuedAt: sale.createdAt,
    showDiscountOnInvoice: sale.showDiscountOnInvoice,
    notes: sale.notes,
    customer: {
      name: cust?.name,
      email: cust?.email,
      phone: cust?.phone,
      address: String(o.homeAddress ?? ""),
    },
    items: sale.items.map((it) => ({
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
      discountAmount: it.discountAmount,
      productSize: it.productSize,
      productSizeUnit: it.productSizeUnit,
      warehouseName: undefined,
      warehouse: undefined,
    })),
    totals: {
      total: sale.totalAmount,
      subtotal: sale.totalAmount,
      discount: sale.metadata?.discountTotal,
      paid:
        o.paymentAmount != null ? Number(o.paymentAmount) : undefined,
      outstanding: sale.outstandingBalance,
    },
    paymentSummary: sale.payments ?? [],
  };
  return generatePDFFromInvoiceData(invoiceData);
}

export async function approveSalePayment(
  saleId: string,
  payload: ApproveSalePayload
): Promise<Sale> {
  const updated = await getConvexClient().mutation(api.sales.approvePayment, {
    id: saleId as Id<"sales">,
    amountPaid: payload.amountPaid,
    note: payload.note,
  });
  return convexOrderToSale(updated as unknown as Record<string, unknown>);
}

export async function querySalePayment(
  saleId: string,
  payload: QuerySalePayload
): Promise<Sale> {
  const updated = await getConvexClient().mutation(api.sales.queryPayment, {
    id: saleId as Id<"sales">,
    note: payload.note,
  });
  return convexOrderToSale(updated as unknown as Record<string, unknown>);
}

export async function rejectSalePayment(
  saleId: string,
  payload: RejectSalePayload
): Promise<Sale> {
  const updated = await getConvexClient().mutation(api.sales.rejectPayment, {
    id: saleId as Id<"sales">,
    note: payload.note,
  });
  return convexOrderToSale(updated as unknown as Record<string, unknown>);
}

export async function getSalesByCustomer(customerId: string): Promise<Sale[]> {
  const rows = await getConvexClient().query(api.sales.byCustomer, {
    customerId: customerId as Id<"customers">,
  });
  return (rows as Record<string, unknown>[]).map((r) => convexOrderToSale(r));
}

export async function getSalesByDateRange(
  dateFrom: string,
  dateTo: string
): Promise<Sale[]> {
  const rows = await getConvexClient().query(api.sales.byDateRange, {
    dateFrom,
    dateTo,
  });
  return (rows as Record<string, unknown>[]).map((r) => convexOrderToSale(r));
}

export async function getSalesWithPendingPayments(): Promise<Sale[]> {
  const rows = await getConvexClient().query(api.sales.pendingPaymentSales, {});
  return (rows as Record<string, unknown>[]).map((r) => convexOrderToSale(r));
}

export async function searchSales(searchQuery: string): Promise<Sale[]> {
  const rows = await getConvexClient().query(api.sales.searchOrders, {
    query: searchQuery,
  });
  return (rows as Record<string, unknown>[]).map((r) => convexOrderToSale(r));
}

export async function getDailySales(date: string): Promise<Sale[]> {
  const rows = await getConvexClient().query(api.sales.dailyOrders, { date });
  return (rows as Record<string, unknown>[]).map((r) => convexOrderToSale(r));
}

export async function getMonthlySalesReport(): Promise<{
  total: number;
  revenue: number;
}> {
  return getConvexClient().query(api.sales.monthlyReport, {});
}