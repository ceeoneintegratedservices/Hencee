import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

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

// Orders API Functions
export async function fetchOrdersDashboard(params: OrdersListParams = {}): Promise<OrdersDashboardResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.status) queryParams.set('status', params.status);
  if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) queryParams.set('dateTo', params.dateTo);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortDir) queryParams.set('sortDir', params.sortDir);

  const url = `${API_ENDPOINTS.orders}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  try {
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching orders dashboard:', error);
    throw error;
  }
}

export async function getOrderById(id: string): Promise<Order> {
  try {
    const response = await authFetch(API_ENDPOINTS.orderById(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Update order status using PATCH method
 * @param id - Order ID
 * @param status - New status (PENDING, COMPLETED, CANCELLED)
 * @returns Promise<void>
 */
export async function updateOrderStatus(id: string, status: "PENDING" | "COMPLETED" | "CANCELLED"): Promise<Order> {
  try {
    const payload: OrderStatusUpdatePayload = { status };
    
    const response = await authFetch(API_ENDPOINTS.orderStatus(id), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update order status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Create a new order
 * @param orderData - Order creation data
 * @returns Promise<Order>
 */
export async function createOrder(orderData: any): Promise<Order> {
  try {
    const response = await authFetch(API_ENDPOINTS.orders, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create order');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Get orders by customer ID
 * @param customerId - Customer ID
 * @returns Promise<Order[]>
 */
export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.orders}/customer/${customerId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    throw error;
  }
}

/**
 * Get orders by date range
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @returns Promise<Order[]>
 */
export async function getOrdersByDateRange(dateFrom: string, dateTo: string): Promise<Order[]> {
  try {
    const queryParams = new URLSearchParams({
      dateFrom,
      dateTo,
    });
    
    const url = `${API_ENDPOINTS.orders}/date-range?${queryParams.toString()}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching orders by date range:', error);
    throw error;
  }
}

/**
 * Search orders
 * @param query - Search query
 * @returns Promise<Order[]>
 */
export async function searchOrders(query: string): Promise<Order[]> {
  try {
    const queryParams = new URLSearchParams({ search: query });
    const url = `${API_ENDPOINTS.orders}/search?${queryParams.toString()}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching orders:', error);
    throw error;
  }
}

/**
 * Get daily orders
 * @param date - Date string
 * @returns Promise<Order[]>
 */
export async function getDailyOrders(date: string): Promise<Order[]> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.orders}/daily/${date}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching daily orders:', error);
    throw error;
  }
}

/**
 * Get monthly orders report
 * @returns Promise<any>
 */
export async function getMonthlyOrdersReport(): Promise<any> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.orders}/monthly-report`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching monthly orders report:', error);
    throw error;
  }
}
