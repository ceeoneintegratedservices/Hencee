import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

// Types for Sales API
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
    action?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface CreateSalePayload {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    price?: number; // Legacy field
    total?: number; // Legacy field
    product?: {
      id: string;
      name: string;
      image?: string;
      sku?: string;
      sellingPrice?: number;
    };
  }>;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// Sales API Functions
export async function fetchSalesDashboard(params: SalesListParams = {}): Promise<SalesDashboardResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.status) queryParams.set('status', params.status);
  if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) queryParams.set('dateTo', params.dateTo);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortDir) queryParams.set('sortDir', params.sortDir);

  const url = `${API_ENDPOINTS.salesDashboard}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  try {
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sales dashboard:', error);
    throw error;
  }
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  try {
    const response = await authFetch(API_ENDPOINTS.sales, {
      method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create sale');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
}

export async function getSaleById(id: string): Promise<Sale> {
  try {
    const response = await authFetch(API_ENDPOINTS.saleById(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sale:', error);
    throw error;
  }
}

export async function updateSaleStatus(id: string, status: string): Promise<void> {
  try {
    const response = await authFetch(API_ENDPOINTS.saleStatus(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    body: JSON.stringify({ status }),
  });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update sale status');
    }
  } catch (error) {
    console.error('Error updating sale status:', error);
    throw error;
  }
}

export async function getSalesByCustomer(customerId: string): Promise<Sale[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.salesByCustomer(customerId));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching customer sales:', error);
    throw error;
  }
}

export async function getSalesByDateRange(dateFrom: string, dateTo: string): Promise<Sale[]> {
  try {
    const queryParams = new URLSearchParams({
      dateFrom,
      dateTo,
    });
    
    const url = `${API_ENDPOINTS.salesDateRange}?${queryParams.toString()}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sales by date range:', error);
    throw error;
  }
}

export async function getSalesWithPendingPayments(): Promise<Sale[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.salesPendingPayments);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    throw error;
  }
}

export async function searchSales(query: string): Promise<Sale[]> {
  try {
    const queryParams = new URLSearchParams({ search: query });
    const url = `${API_ENDPOINTS.salesSearch}?${queryParams.toString()}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching sales:', error);
    throw error;
  }
}

export async function getDailySales(date: string): Promise<Sale[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.salesDaily(date));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    throw error;
  }
}

export async function getMonthlySalesReport(): Promise<any> {
  try {
    const response = await authFetch(API_ENDPOINTS.salesMonthlyReport);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching monthly sales report:', error);
    throw error;
  }
}