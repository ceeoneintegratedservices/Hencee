import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

export interface SalesReportParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  groupBy?: 'day' | 'week' | 'month' | 'year';
  productId?: string;
  categoryId?: string;
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

/**
 * Get sales report data
 */
export async function getSalesReport(params: SalesReportParams = {}): Promise<SalesReportResponse> {
  try {
    const qp = new URLSearchParams();
    if (params.startDate) qp.set("startDate", params.startDate);
    if (params.endDate) qp.set("endDate", params.endDate);
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
    if (params.startDate) qp.set("startDate", params.startDate);
    if (params.endDate) qp.set("endDate", params.endDate);
    if (params.groupBy) qp.set("groupBy", params.groupBy);
    
    const url = `${API_ENDPOINTS.reports.finance}${qp.toString() ? `?${qp.toString()}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}