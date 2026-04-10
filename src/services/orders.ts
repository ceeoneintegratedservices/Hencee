import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

function asOrder(data: unknown): Order {
  return data as Order;
}

function asOrderList(data: unknown): Order[] {
  return data as Order[];
}

// Types for Orders API
export interface OrderStatusUpdatePayload {
  status: "PENDING" | "COMPLETED" | "CANCELLED";
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  trackingId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    customerSince: string;
    status: "Active" | "Pending" | "Inactive";
  };
  homeAddress: string;
  billingAddress: string;
  paymentMethod: string;
  payment: string;
  paymentAmount?: string;
  orderType: string;
  items: Array<{
    id: string;
    productName: string;
    productImage: string;
    unitPrice: number;
    quantity: number;
    discount: number;
    orderTotal: number;
    status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Completed" | "In-Progress" | "Returned" | "Damaged" | "Defective" | "Canceled";
    warehouseNumber?: string;
    productSize?: string;
    productSizeUnit?: string;
  }>;
  totalAmount: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Completed" | "In-Progress" | "Returned" | "Damaged" | "Defective" | "Canceled";
  statusColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface OrdersDashboardResponse {
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
    action?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

// Orders API Functions (Convex `sales` table)
export async function fetchOrdersDashboard(params: OrdersListParams = {}): Promise<OrdersDashboardResponse> {
  return getConvexClient().query(api.sales.ordersDashboard, {
    page: params.page,
    limit: params.limit,
    search: params.search,
    status: params.status,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  });
}

export async function getOrderById(id: string): Promise<Order> {
  const data = await getConvexClient().query(api.sales.getById, { id: id as Id<"sales"> });
  return asOrder(data);
}

/**
 * Update order status using PATCH method
 * @param id - Order ID
 * @param status - New status (PENDING, COMPLETED, CANCELLED)
 * @returns Promise<void>
 */
export async function updateOrderStatus(id: string, status: "PENDING" | "COMPLETED" | "CANCELLED"): Promise<Order> {
  const data = await getConvexClient().mutation(api.sales.updateStatus, {
    id: id as Id<"sales">,
    status,
  });
  return asOrder(data);
}

/**
 * Create a new order
 * @param orderData - Order creation data
 * @returns Promise<Order>
 */
export async function createOrder(orderData: {
  customerId: string;
  items: unknown;
  totalAmount: number;
  status?: string;
  orderType?: string;
  paymentMethod?: string;
}): Promise<Order> {
  const data = await getConvexClient().mutation(api.sales.create, {
    customerId: orderData.customerId as Id<"customers">,
    items: orderData.items,
    totalAmount: orderData.totalAmount,
    status: orderData.status,
    orderType: orderData.orderType,
    paymentMethod: orderData.paymentMethod,
  });
  return asOrder(data);
}

/**
 * Get orders by customer ID
 * @param customerId - Customer ID
 * @returns Promise<Order[]>
 */
export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const data = await getConvexClient().query(api.sales.byCustomer, {
    customerId: customerId as Id<"customers">,
  });
  return asOrderList(data);
}

/**
 * Get orders by date range
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @returns Promise<Order[]>
 */
export async function getOrdersByDateRange(dateFrom: string, dateTo: string): Promise<Order[]> {
  const data = await getConvexClient().query(api.sales.byDateRange, { dateFrom, dateTo });
  return asOrderList(data);
}

/**
 * Search orders
 * @param query - Search query
 * @returns Promise<Order[]>
 */
export async function searchOrders(query: string): Promise<Order[]> {
  const data = await getConvexClient().query(api.sales.searchOrders, { query });
  return asOrderList(data);
}

/**
 * Get daily orders
 * @param date - Date string
 * @returns Promise<Order[]>
 */
export async function getDailyOrders(date: string): Promise<Order[]> {
  const data = await getConvexClient().query(api.sales.dailyOrders, { date });
  return asOrderList(data);
}

/**
 * Get monthly orders report
 * @returns Promise<any>
 */
export async function getMonthlyOrdersReport(): Promise<unknown> {
  return getConvexClient().query(api.sales.monthlyReport, {});
}
