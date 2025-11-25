import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export type SaleUnitType = "piece" | "carton" | "roll";
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

export async function downloadSaleInvoice(
  saleId: string,
  variant: "standard" | "outsourced" = "standard"
): Promise<Blob> {
  const url = API_ENDPOINTS.saleInvoice(saleId, variant);
  const response = await authFetch(url);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || "Failed to download invoice");
  }
  return response.blob();
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