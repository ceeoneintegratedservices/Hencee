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
  const res = await authFetch(`${API_ENDPOINTS.customers}${buildQuery(params)}`);
  if (!res.ok) throw new Error(`Failed to fetch customers (${res.status})`);
  const data = await res.json();
  // Backend returns an array directly
  return data as CustomersListResponse;
}

export async function getCustomer(id: string): Promise<CustomerRecord> {
  const res = await authFetch(`${API_ENDPOINTS.customers}/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch customer (${res.status})`);
  return res.json();
}

export async function createCustomer(body: CreateCustomerBody): Promise<CustomerRecord> {
  const res = await authFetch(`${API_ENDPOINTS.customers}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create customer (${res.status})`);
  return res.json();
}

export async function updateCustomer(id: string, body: UpdateCustomerBody): Promise<CustomerRecord> {
  const res = await authFetch(`${API_ENDPOINTS.customers}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update customer (${res.status})`);
  return res.json();
}


