import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";
import type { CustomersListQuery, CustomersListResponse, CustomerRecord, CreateCustomerBody, UpdateCustomerBody } from "../types/customers";

function buildQuery(params: CustomersListQuery = {}): string {
  const qp = new URLSearchParams();
  if (params.page != null) qp.set("page", String(params.page));
  if (params.limit != null) qp.set("limit", String(params.limit));
  if (params.search) qp.set("search", params.search);
  const qs = qp.toString();
  return qs ? `?${qs}` : "";
}

export async function listCustomers(params: CustomersListQuery = {}): Promise<CustomersListResponse> {
  try {
    const res = await authFetch(`${API_ENDPOINTS.customers}${buildQuery(params)}`);
    const data = await res.json();
    
    // The API returns a paginated object with data, total, page, limit
    if (data && Array.isArray(data.data)) {
      return data.data;
    } 
    // Fallback if the response is an array directly
    else if (Array.isArray(data)) {
      return data;
    } 
    // If we can't find an array, return an empty array
    else {
      console.error("Unexpected API response format:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
}

export async function getCustomer(id: string): Promise<CustomerRecord> {
  try {
    const res = await authFetch(`${API_ENDPOINTS.customers}/${encodeURIComponent(id)}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw error;
  }
}

export async function createCustomer(body: CreateCustomerBody): Promise<CustomerRecord> {
  try {
    const res = await fetch(`${API_ENDPOINTS.customers}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create customer (${res.status})`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}

export async function updateCustomer(id: string, body: UpdateCustomerBody): Promise<CustomerRecord> {
  try {
    const res = await authFetch(`${API_ENDPOINTS.customers}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw error;
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    const response = await authFetch(API_ENDPOINTS.customerById(id), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete customer');
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
}

export async function getCustomerSales(id: string): Promise<any[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.customerSales(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching customer sales:', error);
    throw error;
  }
}


export async function searchCustomers(query: string): Promise<CustomerRecord[]> {
  try {
    const queryParams = new URLSearchParams({ search: query });
    const url = `${API_ENDPOINTS.customerSearch}?${queryParams.toString()}`;
    const response = await authFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
}

export async function getOutstandingBalances(): Promise<any[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.customerOutstandingBalance);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching outstanding balances:', error);
    throw error;
  }
}

export async function getTopCustomers(): Promise<CustomerRecord[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.customerTop);
    const data = await response.json();
    
    // Handle different response formats
    if (data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      console.error("Unexpected top customers API response format:", data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching top customers:', error);
    throw error;
  }
}

export async function updateCustomerCreditLimit(id: string, creditLimit: number): Promise<CustomerRecord> {
  try {
    const response = await authFetch(API_ENDPOINTS.customerCreditLimit(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ creditLimit }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update credit limit');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating credit limit:', error);
    throw error;
  }
}

// Customer Summary Types
export interface CustomerStats {
  totalPurchases: number;
  totalAmount: number;
  outstandingBalance: number;
  lastPurchaseDate?: string;
  averagePurchaseAmount: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalPurchases: number;
  totalAmount: number;
  lastPurchaseDate?: string;
  rank: number;
}

export interface OutstandingBalanceCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  outstandingBalance: number;
  creditLimit: number;
  lastPurchaseDate?: string;
}

// Customer Summary Functions
export async function getCustomerStats(id: string): Promise<CustomerStats> {
  try {
    const response = await authFetch(API_ENDPOINTS.customerStats(id));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    throw error;
  }
}

export async function getOutstandingBalanceCustomers(): Promise<OutstandingBalanceCustomer[]> {
  try {
    const response = await authFetch(API_ENDPOINTS.customerOutstandingBalance);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching outstanding balance customers:', error);
    throw error;
  }
}


