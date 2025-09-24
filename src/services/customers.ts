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
    const res = await authFetch(`${API_ENDPOINTS.customers}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
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


