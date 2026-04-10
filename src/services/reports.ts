import { getConvexClient, api } from "@/lib/convexClient";

export interface SalesReportParams {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month" | "year";
  productId?: string;
  categoryId?: string;
  dateRange?: string;
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
      productSize?: string;
      productSizeUnit?: string;
      packSize?: string;
      category?: {
        id: string;
        name: string;
      };
      categoryName?: string;
      cost?: number;
    }[];
    topCategories?: {
      id: string;
      name: string;
      totalRevenue: number;
      totalQuantity: number;
      productCount: number;
    }[];
  };
}

export interface FinanceReportParams {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month" | "year";
  dateRange?: string;
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
    momProfit?: number;
    yoyProfit?: number;
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

function currentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function resolveDateRange(params: {
  startDate?: string;
  endDate?: string;
  dateRange?: string;
}): { startDate?: string; endDate?: string } {
  if (params.startDate && params.endDate) {
    return { startDate: params.startDate, endDate: params.endDate };
  }
  if (!params.dateRange || params.dateRange === "this_month") {
    return currentMonthRange();
  }
  return {};
}

export async function getSalesReport(
  params: SalesReportParams = {}
): Promise<SalesReportResponse> {
  const { startDate, endDate } = resolveDateRange(params);
  const data = await getConvexClient().query(api.reports.sales, {
    startDate,
    endDate,
    groupBy: params.groupBy,
    productId: params.productId,
    categoryId: params.categoryId,
  });
  return data as SalesReportResponse;
}

export async function getFinanceReport(
  params: FinanceReportParams = {}
): Promise<FinanceReportResponse> {
  const { startDate, endDate } = resolveDateRange(params);
  const data = await getConvexClient().query(api.reports.finance, {
    startDate,
    endDate,
    groupBy: params.groupBy,
  });
  return data as FinanceReportResponse;
}

export async function getDashboardOverview(
  timeframe: string = "thisWeek"
): Promise<unknown> {
  return getConvexClient().query(api.dashboard.overview, { timeframe });
}

export async function getDashboardSales(
  timeframe: string = "thisWeek"
): Promise<unknown> {
  return getConvexClient().query(api.dashboard.salesSlice, { timeframe });
}

export async function getDashboardCustomers(
  timeframe: string = "thisWeek"
): Promise<unknown> {
  return getConvexClient().query(api.dashboard.customersSlice, { timeframe });
}

export async function getDashboardProducts(
  timeframe: string = "thisWeek"
): Promise<unknown> {
  return getConvexClient().query(api.dashboard.productsSlice, { timeframe });
}

export async function getDashboardOrders(
  timeframe: string = "thisWeek"
): Promise<unknown> {
  return getConvexClient().query(api.dashboard.ordersSlice, { timeframe });
}

export async function getOutsourcedReport(
  params: OutsourcedReportParams = {}
): Promise<OutsourcedReportResponse> {
  const { startDate, endDate } = resolveDateRange(params);
  const data = await getConvexClient().query(api.reports.outsourced, {
    startDate,
    endDate,
  });
  const raw = data as OutsourcedReportResponse & { outsourcedProducts?: number };
  return {
    summary: raw.summary,
    suppliers: raw.suppliers,
    paymentStatus: raw.paymentStatus,
    timeline: raw.timeline,
  };
}
