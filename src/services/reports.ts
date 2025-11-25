import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export interface SalesReportParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  groupBy?: 'day' | 'week' | 'month' | 'year';
  productId?: string;
  categoryId?: string;
  dateRange?: string; // Backend compatibility
}

export interface SalesReportItem {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  products?: {
    id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }[];
}

export interface SalesReportResponse {
  data: SalesReportItem[];
  summary: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    topProducts: {
      id: string;
      name: string;
      totalSold: number;
      revenue: number;
    }[];
  };
}

export interface FinanceReportParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  groupBy?: 'day' | 'week' | 'month' | 'year';
  dateRange?: string; // Backend compatibility
}

export interface FinanceReportItem {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  paymentMethods?: {
    method: string;
    amount: number;
    count: number;
  }[];
}

export interface FinanceReportResponse {
  data: FinanceReportItem[];
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    profitMargin: number;
    paymentMethods: {
      method: string;
      amount: number;
      count: number;
      percentage: number;
    }[];
  };
}

export interface OutsourcedReportParams {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  outsourcedSupplier?: string;
  supplierId?: string;
}

export interface OutsourcedReportSummary {
  totalOrders?: number;
  totalRevenue?: number;
  totalCost?: number;
  totalMargin?: number;
  averageMargin?: number;
  outstandingBalance?: number;
}

export interface OutsourcedSupplierRow {
  supplierId?: string;
  supplierName?: string;
  orders?: number;
  revenue?: number;
  cost?: number;
  margin?: number;
  marginPercent?: number;
  outstandingBalance?: number;
  paymentStatusBreakdown?: Record<string, number>;
}

export interface OutsourcedPaymentStatusEntry {
  status: string;
  count?: number;
  amount?: number;
}

export interface OutsourcedTimelinePoint {
  period: string;
  revenue?: number;
  cost?: number;
  margin?: number;
  outstandingBalance?: number;
}

export interface OutsourcedReportResponse {
  summary?: OutsourcedReportSummary;
  suppliers?: OutsourcedSupplierRow[];
  paymentStatus?: OutsourcedPaymentStatusEntry[];
  timeline?: OutsourcedTimelinePoint[];
}

/**
 * Get sales report data
 */
export async function getSalesReport(params: SalesReportParams = {}): Promise<SalesReportResponse> {
  try {
    const qp = new URLSearchParams();
    // Use dateRange parameter for backend compatibility
    if (params.startDate && params.endDate) {
      qp.set("dateRange", "custom");
      qp.set("startDate", params.startDate);
      qp.set("endDate", params.endDate);
    } else if (params.dateRange) {
      qp.set("dateRange", params.dateRange);
    } else {
      qp.set("dateRange", "this_month"); // Default to this month
    }
    if (params.groupBy) qp.set("groupBy", params.groupBy);
    if (params.productId) qp.set("productId", params.productId);
    if (params.categoryId) qp.set("categoryId", params.categoryId);
    
    const url = `${API_ENDPOINTS.reports.sales}${qp.toString() ? `?${qp.toString()}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get finance report data
 */
export async function getFinanceReport(params: FinanceReportParams = {}): Promise<FinanceReportResponse> {
  try {
    const qp = new URLSearchParams();
    // Use dateRange parameter for backend compatibility
    if (params.startDate && params.endDate) {
      qp.set("dateRange", "custom");
      qp.set("startDate", params.startDate);
      qp.set("endDate", params.endDate);
    } else if (params.dateRange) {
      qp.set("dateRange", params.dateRange);
    } else {
      qp.set("dateRange", "this_month"); // Default to this month
    }
    if (params.groupBy) qp.set("groupBy", params.groupBy);
    
    const url = `${API_ENDPOINTS.reports.finance}${qp.toString() ? `?${qp.toString()}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get dashboard overview data
 */
export async function getDashboardOverview(timeframe: string = 'thisWeek'): Promise<any> {
  try {
    const url = `${API_ENDPOINTS.dashboardOverview}?timeframe=${timeframe}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get dashboard sales data
 */
export async function getDashboardSales(timeframe: string = 'thisWeek'): Promise<any> {
  try {
    const url = `${API_ENDPOINTS.dashboardSales}?timeframe=${timeframe}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get dashboard customers data
 */
export async function getDashboardCustomers(timeframe: string = 'thisWeek'): Promise<any> {
  try {
    const url = `${API_ENDPOINTS.dashboardCustomers}?timeframe=${timeframe}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get dashboard products data
 */
export async function getDashboardProducts(timeframe: string = 'thisWeek'): Promise<any> {
  try {
    const url = `${API_ENDPOINTS.dashboardProducts}?timeframe=${timeframe}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get dashboard orders data
 */
export async function getDashboardOrders(timeframe: string = 'thisWeek'): Promise<any> {
  try {
    const url = `${API_ENDPOINTS.dashboardOrders}?timeframe=${timeframe}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getOutsourcedReport(
  params: OutsourcedReportParams = {}
): Promise<OutsourcedReportResponse> {
  const qp = new URLSearchParams();
  if (params.startDate && params.endDate) {
    qp.set("startDate", params.startDate);
    qp.set("endDate", params.endDate);
    qp.set("dateRange", "custom");
  } else if (params.dateRange) {
    qp.set("dateRange", params.dateRange);
  }
  if (params.outsourcedSupplier) {
    qp.set("outsourcedSupplier", params.outsourcedSupplier);
  } else if (params.supplierId) {
    qp.set("outsourcedSupplier", params.supplierId);
  }
  const url = `${API_ENDPOINTS.reports.outsourced}${
    qp.toString() ? `?${qp.toString()}` : ""
  }`;
  const res = await authFetch(url);
  return res.json();
}