// Customer Portal Service
import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";
import type {
  CustomerProfile,
  CustomerOrder,
  CustomerOrdersResponse,
  ProductSearchResult,
  CreateOrderPayload,
  CustomerDebt,
  PayDebtPayload,
  RefundRequestPayload,
  SupportTicketPayload,
  SupportTicket,
  CustomerNotification,
} from "../types/customerPortal";

// ============================================
// Profile
// ============================================

export async function getMyProfile(): Promise<CustomerProfile> {
  try {
    const res = await authFetch(API_ENDPOINTS.customerPortal.me);
    const data = await res.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
}

export async function updateMyProfile(
  updates: Partial<Pick<CustomerProfile, 'email' | 'phone' | 'address' | 'profileImageUrl'>>
): Promise<CustomerProfile> {
  try {
    const res = await authFetch(API_ENDPOINTS.customerPortal.updateMe, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.data || data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// ============================================
// Orders
// ============================================

export async function getMyOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<CustomerOrdersResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.status) queryParams.append("status", params.status);

    const url = `${API_ENDPOINTS.customerPortal.myOrders}${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    
    // Handle both array and paginated response
    if (Array.isArray(data)) {
      return { data, total: data.length, page: 1, limit: data.length };
    }
    return data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

export async function createOrder(payload: CreateOrderPayload): Promise<CustomerOrder> {
  try {
    const res = await authFetch(API_ENDPOINTS.customerPortal.createOrder, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.data || data;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

// ============================================
// Products
// ============================================

export async function searchProducts(params: {
  q?: string;
  category?: string;
}): Promise<ProductSearchResult[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append("q", params.q);
    if (params.category) queryParams.append("category", params.category);

    const url = `${API_ENDPOINTS.customerPortal.searchProducts}${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await authFetch(url);
    const data = await res.json();
    return data.data || data || [];
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
}

// ============================================
// Debts
// ============================================

export async function getMyDebts(): Promise<CustomerDebt[]> {
  try {
    const res = await authFetch(API_ENDPOINTS.customerPortal.myDebts);
    const data = await res.json();
    return data.data || data || [];
  } catch (error) {
    console.error("Error fetching debts:", error);
    throw error;
  }
}

export async function payDebt(payload: PayDebtPayload): Promise<{ success: boolean; message: string }> {
  try {
    const res = await authFetch(API_ENDPOINTS.customerPortal.payDebt, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error paying debt:", error);
    throw error;
  }
}

// ============================================
// Refunds
// ============================================

export async function requestRefund(payload: RefundRequestPayload): Promise<{ success: boolean; message: string }> {
  try {
    const res = await authFetch(API_ENDPOINTS.customerPortal.requestRefund, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error requesting refund:", error);
    throw error;
  }
}

// ============================================
// Support
// ============================================

export async function createSupportTicket(payload: SupportTicketPayload): Promise<SupportTicket> {
  try {
    const res = await authFetch(API_ENDPOINTS.customerPortal.createTicket, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.data || data;
  } catch (error) {
    console.error("Error creating support ticket:", error);
    throw error;
  }
}

// ============================================
// Notifications
// ============================================

export async function getNotifications(): Promise<CustomerNotification[]> {
  try {
    const res = await authFetch(API_ENDPOINTS.customerPortal.notifications);
    const data = await res.json();
    return data.data || data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}
