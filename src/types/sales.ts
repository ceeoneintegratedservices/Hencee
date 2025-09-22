export type OrderStatus = "Pending" | "Completed" | "Canceled" | "Returned" | "Damaged" | "Abandoned" | "Processing" | "Shipped" | string;

export interface SalesSummary {
  allOrders: number;
  pending: number;
  completed: number;
  canceled: number;
  returned: number;
  damaged: number;
  abandonedCart: number;
  customers: number;
}

export interface SalesOrderItem {
  id: string;
  customerName: string;
  orderDate: string; // already formatted like "19 Sep 2025 - 8:39 pm"
  orderType: string; // e.g., "Home Delivery"
  trackingId: string;
  orderTotal: string; // already formatted with currency symbol
  action: string; // e.g., "Completed"
  status: string; // e.g., "Completed"
  statusColor?: string; // e.g., "green" from API
}

export interface SalesDashboardResponse {
  summary: SalesSummary;
  orders: SalesOrderItem[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesDashboardQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string; // ISO string
  dateTo?: string;   // ISO string
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

// Minimal detail shape for a single sale fetched by id
export interface SaleDetail {
  id?: string;
  customerName?: string;
  orderDate?: string;
  orderType?: string;
  trackingId?: string;
  orderTotal?: string | number;
  status?: string;
  statusColor?: string;
  // Optional extended fields if backend provides them
  items?: Array<{
    productName?: string;
    unitPrice?: number;
    quantity?: number;
    orderTotal?: number;
    status?: string;
  }>;
  homeAddress?: string;
  billingAddress?: string;
  paymentMethod?: string;
}


